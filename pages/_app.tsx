import { AppProvider } from '../contexts/AppContext';
import { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AppProvider>
      <Component {...pageProps} />
    </AppProvider>
  );
}

export default MyApp; 