/** @type {import('next').NextConfig} */
const nextConfig = {
  // Segurança: não mude nada aqui sem necessidade
  reactStrictMode: true,

  // Mantém o build estrito (ajuda a evitar regressões silenciosas)
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },

  // Domínios de imagens remotas usados no app
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.pixabay.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },

  // Se você não precisa de nenhuma reescrita, retorne array vazio.
  // Estrutura VÁLIDA: uma função async que retorna um array OU
  // um objeto { beforeFiles, afterFiles, fallback } com arrays.
  async rewrites() {
    return [];
  },

  // Se um dia precisar de redirects, siga este formato:
  // async redirects() {
  //   return [
  //     { source: '/old', destination: '/new', permanent: true },
  //   ];
  // },
};

export default nextConfig;
