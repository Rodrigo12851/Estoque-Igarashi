import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocFromServer, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  writeBatch,
  onSnapshot 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp({
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId,
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
});

// Initialize Firestore with custom databaseId
export const db = getFirestore(
  app, 
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== ''
    ? firebaseConfig.firestoreDatabaseId 
    : undefined
);

let conexaoAtiva = false;
let ouvintesRegistrados = false;

// Test connection on boot
export async function testarConexao(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'cadastros', 'principal'));
    conexaoAtiva = true;
    return true;
  } catch (error) {
    // If doc doesn't exist, getDocFromServer might still succeed with doc.exists() == false
    // If client is offline or permissions fail:
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase: O cliente está offline. Usando cache local.");
      return false;
    }
    // Any other response that reached the server (e.g. doc not found) confirms connectivity
    conexaoAtiva = true;
    return true;
  }
}

// Salvar tabelas de cadastros gerais (cultura, variedade, produto, local, fazenda, gleba, pivo, controle, usuario)
export async function salvarCadastrosNoBanco(cadastros: any): Promise<boolean> {
  try {
    const docRef = doc(db, 'cadastros', 'principal');
    const dadosParaSalvar = {
      cultura: cadastros.cultura || [],
      variedade: cadastros.variedade || [],
      produto: cadastros.produto || [],
      local: cadastros.local || [],
      fazenda: cadastros.fazenda || [],
      gleba: cadastros.gleba || [],
      pivo: cadastros.pivo || [],
      controle: cadastros.controle || [],
      usuario: cadastros.usuario || [],
      atualizadoEm: new Date().toISOString()
    };
    await setDoc(docRef, dadosParaSalvar, { merge: true });
    return true;
  } catch (err) {
    console.error("Erro ao salvar cadastros no Firebase:", err);
    return false;
  }
}

// Salvar lote de entradas no banco
export async function salvarEntradasNoBanco(entradas: any[]): Promise<boolean> {
  try {
    if (!entradas || entradas.length === 0) return true;
    
    // Processar em lotes (batch) de até 400
    const tamanhoLote = 400;
    for (let i = 0; i < entradas.length; i += tamanhoLote) {
      const lote = entradas.slice(i, i + tamanhoLote);
      const batch = writeBatch(db);
      
      lote.forEach(e => {
        const idStr = String(e.id);
        const docRef = doc(db, 'entradas', idStr);
        batch.set(docRef, {
          id: Number(e.id),
          data: String(e.data || ''),
          controleId: Number(e.controleId || 0),
          glebaId: Number(e.glebaId || 0),
          variedadeId: Number(e.variedadeId || 0),
          produtoId: Number(e.produtoId || 0),
          localId: Number(e.localId || 0),
          embalagem: String(e.embalagem || 'Saco'),
          qtd: Number(e.qtd || 0),
          observacao: String(e.observacao || ''),
          criadoEm: e.criadoEm || new Date().toISOString()
        }, { merge: true });
      });

      await batch.commit();
    }
    return true;
  } catch (err) {
    console.error("Erro ao salvar entradas no Firebase:", err);
    return false;
  }
}

// Salvar entrada individual
export async function salvarEntradaIndividual(entrada: any): Promise<boolean> {
  try {
    const docRef = doc(db, 'entradas', String(entrada.id));
    await setDoc(docRef, {
      id: Number(entrada.id),
      data: String(entrada.data || ''),
      controleId: Number(entrada.controleId || 0),
      glebaId: Number(entrada.glebaId || 0),
      variedadeId: Number(entrada.variedadeId || 0),
      produtoId: Number(entrada.produtoId || 0),
      localId: Number(entrada.localId || 0),
      embalagem: String(entrada.embalagem || 'Saco'),
      qtd: Number(entrada.qtd || 0),
      observacao: String(entrada.observacao || ''),
      atualizadoEm: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.error("Erro ao salvar entrada individual:", err);
    return false;
  }
}

// Excluir entrada do banco
export async function excluirEntradaNoBanco(id: number | string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'entradas', String(id)));
    return true;
  } catch (err) {
    console.error("Erro ao excluir entrada no Firebase:", err);
    return false;
  }
}

// Salvar lote de saídas no banco
export async function salvarSaidasNoBanco(saidas: any[]): Promise<boolean> {
  try {
    if (!saidas || saidas.length === 0) return true;
    
    const tamanhoLote = 400;
    for (let i = 0; i < saidas.length; i += tamanhoLote) {
      const lote = saidas.slice(i, i + tamanhoLote);
      const batch = writeBatch(db);
      
      lote.forEach(s => {
        const idStr = String(s.id);
        const docRef = doc(db, 'saidas', idStr);
        batch.set(docRef, {
          id: Number(s.id),
          data: String(s.data || ''),
          controleId: Number(s.controleId || 0),
          glebaId: Number(s.glebaId || 0),
          variedadeId: Number(s.variedadeId || 0),
          produtoId: Number(s.produtoId || 0),
          localId: Number(s.localId || 0),
          embalagem: String(s.embalagem || 'Saco'),
          qtd: Number(s.qtd || 0),
          observacao: String(s.observacao || ''),
          criadoEm: s.criadoEm || new Date().toISOString()
        }, { merge: true });
      });

      await batch.commit();
    }
    return true;
  } catch (err) {
    console.error("Erro ao salvar saídas no Firebase:", err);
    return false;
  }
}

// Salvar saída individual
export async function salvarSaidaIndividual(saida: any): Promise<boolean> {
  try {
    const docRef = doc(db, 'saidas', String(saida.id));
    await setDoc(docRef, {
      id: Number(saida.id),
      data: String(saida.data || ''),
      controleId: Number(saida.controleId || 0),
      glebaId: Number(saida.glebaId || 0),
      variedadeId: Number(saida.variedadeId || 0),
      produtoId: Number(saida.produtoId || 0),
      localId: Number(saida.localId || 0),
      embalagem: String(saida.embalagem || 'Saco'),
      qtd: Number(saida.qtd || 0),
      observacao: String(saida.observacao || ''),
      atualizadoEm: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.error("Erro ao salvar saída individual:", err);
    return false;
  }
}

// Excluir saída do banco
export async function excluirSaidaNoBanco(id: number | string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'saidas', String(id)));
    return true;
  } catch (err) {
    console.error("Erro ao excluir saída no Firebase:", err);
    return false;
  }
}

// Carregar todos os dados do banco de dados na inicialização
export async function carregarTudoDoBanco(): Promise<{
  cadastros: any | null;
  entradas: any[];
  saidas: any[];
}> {
  try {
    // 1. Cadastros
    let dadosCadastros: any = null;
    const snapCad = await getDoc(doc(db, 'cadastros', 'principal'));
    if (snapCad.exists()) {
      dadosCadastros = snapCad.data();
    }

    // 2. Entradas
    const snapEntradas = await getDocs(collection(db, 'entradas'));
    const entradas: any[] = [];
    snapEntradas.forEach(docSnap => {
      entradas.push(docSnap.data());
    });

    // 3. Saídas
    const snapSaidas = await getDocs(collection(db, 'saidas'));
    const saidas: any[] = [];
    snapSaidas.forEach(docSnap => {
      saidas.push(docSnap.data());
    });

    return { cadastros: dadosCadastros, entradas, saidas };
  } catch (err) {
    console.error("Erro ao carregar dados do Firebase:", err);
    return { cadastros: null, entradas: [], saidas: [] };
  }
}

// Sincronização em tempo real (opcional para manter abas atualizadas)
export function iniciarSincronizacaoTempoReal(callback: (tipo: string, dados: any) => void) {
  if (ouvintesRegistrados) return;
  ouvintesRegistrados = true;

  try {
    onSnapshot(doc(db, 'cadastros', 'principal'), (snap) => {
      if (snap.exists()) {
        callback('cadastros', snap.data());
      }
    });

    onSnapshot(collection(db, 'entradas'), (snap) => {
      const lista: any[] = [];
      snap.forEach(d => lista.push(d.data()));
      callback('entradas', lista);
    });

    onSnapshot(collection(db, 'saidas'), (snap) => {
      const lista: any[] = [];
      snap.forEach(d => lista.push(d.data()));
      callback('saidas', lista);
    });
  } catch (err) {
    console.error("Erro nos listeners em tempo real:", err);
  }
}

// Export global helper to window
(window as any).firebaseEstoque = {
  testarConexao,
  salvarCadastrosNoBanco,
  salvarEntradasNoBanco,
  salvarEntradaIndividual,
  excluirEntradaNoBanco,
  salvarSaidasNoBanco,
  salvarSaidaIndividual,
  excluirSaidaNoBanco,
  carregarTudoDoBanco,
  iniciarSincronizacaoTempoReal
};
