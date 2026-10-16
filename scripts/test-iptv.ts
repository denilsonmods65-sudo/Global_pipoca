import { IptvService } from '../src/services/iptvService';

async function runTestSuite() {
  console.log('--- INICIANDO BATERIA DE TESTES IPTV (GLOBAL PIPOCA) ---');
  let passed = 0;
  let failed = 0;

  const service = IptvService.getInstance();

  // Test 1: URL Normalization
  try {
    const norm1 = service.normalizeServerUrl('iptv.servidor.com:8080/');
    if (norm1 === 'http://iptv.servidor.com:8080') {
      console.log('✔ Teste 1: Normalização de URL sem protocolo (adiciona http:// e remove barra)');
      passed++;
    } else {
      throw new Error(`Resultado inesperado: ${norm1}`);
    }
  } catch (e) {
    console.error('✖ Teste 1 falhou:', e);
    failed++;
  }

  // Test 2: Invalidação de Cache e Isolamento de Servidores
  try {
    service.saveCredentials({
      serverUrl: 'http://servidor-a.com',
      username: 'usuarioA',
      password: 'senhaA',
      type: 'xtream',
    });
    service.liveChannels = [{ id: '1', name: 'Canal A', stream_id: 1, category_id: '1' }];

    // Switch/Clear
    service.clearCredentials();

    if (
      service.getCredentials() === null &&
      service.liveChannels.length === 0 &&
      service.userInfo === null
    ) {
      console.log('✔ Teste 2: Isolamento de conta (clearCredentials limpa catálogo e sessão)');
      passed++;
    } else {
      throw new Error('Falha ao limpar estado anterior');
    }
  } catch (e) {
    console.error('✖ Teste 2 falhou:', e);
    failed++;
  }

  // Test 3: Validação de Lista M3U Inválida
  try {
    let errorThrown = false;
    try {
      await service.syncM3uPlaylist('conteudo_invalido_sem_tags');
    } catch (err: any) {
      errorThrown = true;
    }
    if (errorThrown) {
      console.log('✔ Teste 3: Rejeição de lista M3U corrompida ou sem tags #EXTINF');
      passed++;
    } else {
      throw new Error('Deveria ter lançado erro para M3U corrompida');
    }
  } catch (e) {
    console.error('✖ Teste 3 falhou:', e);
    failed++;
  }

  // Test 4: Processamento de Lista M3U Válida
  try {
    const validM3u = `#EXTM3U
#EXTINF:-1 tvg-id="ch1" tvg-name="Globo SP" tvg-logo="http://logos.com/globo.png" group-title="Canais Abertos",Globo SP HD
http://stream.server.com/live/ch1.m3u8
#EXTINF:-1 tvg-id="vod1" tvg-name="Filme de Teste" tvg-logo="http://logos.com/poster.jpg" group-title="Filmes 2025",Filme Ação 4K
http://stream.server.com/movie/filme.mp4`;

    await service.syncM3uPlaylist(validM3u);

    if (
      service.liveChannels.length === 1 &&
      service.liveChannels[0].name === 'Globo SP HD' &&
      service.liveChannels[0].stream_icon === 'http://logos.com/globo.png' &&
      service.movies.length === 1 &&
      service.movies[0].name === 'Filme Ação 4K'
    ) {
      console.log('✔ Teste 4: Associação exata de títulos, categorias e capas em lista M3U');
      passed++;
    } else {
      throw new Error('Itens não foram mapeados corretamente da M3U');
    }
  } catch (e) {
    console.error('✖ Teste 4 falhou:', e);
    failed++;
  }

  // Test 5: Geração de URLs de Stream por Tipo (Live, Movie, Series)
  try {
    service.saveCredentials({
      serverUrl: 'http://provedor.net:8000',
      username: 'meuUser',
      password: 'minhaPassword',
      type: 'xtream',
    });

    const liveUrl = service.getStreamUrl('live', 105);
    const movieUrl = service.getStreamUrl('movie', 2045, 'mkv');
    const seriesUrl = service.getStreamUrl('series', 991, 'mp4');

    if (
      liveUrl === 'http://provedor.net:8000/live/meuUser/minhaPassword/105.m3u8' &&
      movieUrl === 'http://provedor.net:8000/movie/meuUser/minhaPassword/2045.mkv' &&
      seriesUrl === 'http://provedor.net:8000/series/meuUser/minhaPassword/991.mp4'
    ) {
      console.log('✔ Teste 5: Geração de URLs para player de vídeo com extensão e credenciais');
      passed++;
    } else {
      throw new Error(`URLs divergentes: ${liveUrl}, ${movieUrl}, ${seriesUrl}`);
    }
  } catch (e) {
    console.error('✖ Teste 5 falhou:', e);
    failed++;
  }

  // Cleanup
  service.clearCredentials();

  console.log(`\nRESUMO: ${passed} passaram, ${failed} falharam.`);
}

runTestSuite();
