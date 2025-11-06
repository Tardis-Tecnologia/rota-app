export interface Noticia {
  id: string;
  titulo: string;
  resumo: string;
  imagem: string;
  data: string;
  categoria: string;
  conteudo?: string;
  autor?: string;
}

export interface Evento {
  id: string;
  titulo: string;
  data: string;
  horario: string;
  local: string;
  descricao: string;
  tipo: 'Cultura' | 'Saúde' | 'Educação' | 'Meio Ambiente' | 'Esporte' | 'Turismo';
  imagem?: string;
}

export interface Post {
  id: string;
  autor: string;
  avatar: string;
  data: string;
  conteudo: string;
  imagem: string | null;
  curtidas: number;
  comentarios: number;
  compartilhamentos: number;
  curtido: boolean;
  username?: string; // @pref_cidade
  tipo?: 'post' | 'alerta'; // Tipo do post
  titulo?: string; // Para alertas
}

export interface PontoInteresse {
  id: string;
  titulo: string;
  descricao: string;
  latitude: number;
  longitude: number;
  tipo: 'governo' | 'saude' | 'lazer' | 'educacao' | 'cultura' | 'turismo';
}

export interface Localizacao {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

