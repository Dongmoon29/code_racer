// Example usage of RouterHelper
import React from 'react';
import { useRouter } from 'next/router';
import { useRouterHelper, ROUTES } from '@/lib/router';

const ExampleComponent: React.FC = () => {
  const router = useRouter();
  const routerHelper = useRouterHelper(router);

  const handleNavigation = () => {
    // Method 1: Using helper methods (recommended)
    routerHelper.goToDashboard();
    routerHelper.goToGameRoom('some-game-id');
    routerHelper.goToLogin();

    // Method 2: Using route constants
    routerHelper.push(ROUTES.DASHBOARD);
    routerHelper.push(ROUTES.GAME_ROOM('some-game-id'));

    // Method 3: Direct router usage (still available)
    router.push('/dashboard');
  };

  const handleReplace = () => {
    // For redirects (no back button history)
    routerHelper.replaceToLogin();
    routerHelper.replaceToDashboard();
  };

  const handleValidation = () => {
    // Route validation
    const isValidGameId = routerHelper.isValidGameId('some-game-id');
    const isValidLeetCodeId = routerHelper.isValidLeetCodeId('some-id');

    if (isValidGameId) {
      routerHelper.goToGameRoom('some-game-id');
    }
  };

  const handleCurrentRoute = () => {
    // Check current route
    const isOnDashboard = routerHelper.isCurrentRoute(ROUTES.DASHBOARD);
    const isOnGamePage = routerHelper.isCurrentRoutePattern('/game/');

    console.log('Current route:', routerHelper.getCurrentRoute());
    console.log('Query params:', routerHelper.getQuery());
  };

  return (
    <div>
      <button onClick={handleNavigation}>Navigate</button>
      <button onClick={handleReplace}>Replace</button>
      <button onClick={handleValidation}>Validate</button>
      <button onClick={handleCurrentRoute}>Check Route</button>
    </div>
  );
};

export default ExampleComponent;
