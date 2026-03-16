# Criar o arquivo _app.js na pasta pages
cat > pages/_app.js << 'EOF'
import React from 'react';

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
EOF

# Verificar se criou
ls -la pages/