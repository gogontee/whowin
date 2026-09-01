// /app/layout.js
import './globals.css';
import GlobalNavigation from '../components/GlobalNavigation';
import { Providers } from './providers';

export const metadata = {
  title: 'Who Wins Reality Show - Vote for Your Favorite star',
  description: 'Vote, rank, and follow your favorite candidate',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-burnt-orange-50 via-white to-white">
        <Providers>
          {/* Fixed Navigation */}
          <div className="fixed top-0 left-0 right-0 z-40">
            <GlobalNavigation />
          </div>
          
          {/* Main content with padding for fixed nav */}
          <main className="min-h-screen pt-16 md:pt-20">
            {children}
          </main>
          
          {/* Optional: Debug indicator */}
          {process.env.NODE_ENV === 'development' && (
            <div className="fixed bottom-4 right-4 bg-blue-500 text-white text-xs px-2 py-1 rounded z-50">
              Dev Mode
            </div>
          )}
        </Providers>
      </body>
    </html>
  );
}