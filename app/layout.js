// /app/layout.js
import './globals.css';
import GlobalNavigation from '../components/GlobalNavigation';
import { Providers } from './providers';

export const metadata = {
  title: 'Who Wins Reality Show - An exceptional event for young creators',
  description: 'Nigerias premier show for young Talented Creators',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // Important for iPhones with notches
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-[100dvh] overflow-hidden bg-gradient-to-b from-burnt-orange-50 via-white to-white relative">
        <Providers>
          {/* Fixed Navigation - z-[9999] ensures it stays above everything else */}
          <div className="fixed top-0 left-0 right-0 z-[9999]">
            <GlobalNavigation />
          </div>
          
          {/* Main content - This is what scrolls now, not the body */}
          <main className="h-full overflow-y-auto pt-16 md:pt-20 pb-16 md:pb-0">
            {children}
          </main>
          
          {/* Debug indicator */}
          {process.env.NODE_ENV === 'development' && (
            <div className="fixed bottom-4 right-4 bg-blue-500 text-white text-xs px-2 py-1 rounded z-[10000]">
              Dev Mode
            </div>
          )}
        </Providers>
      </body>
    </html>
  );
}