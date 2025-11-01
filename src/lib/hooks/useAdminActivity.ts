import { useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';

const INACTIVITY_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

export function useAdminActivity() {
  const router = useRouter();

  useEffect(() => {
    // Check if user should be logged out due to inactivity
    const checkInactivity = () => {
      const lastActivity = localStorage.getItem('adminLastActivity');

      if (lastActivity) {
        const lastActivityTime = parseInt(lastActivity, 10);
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivityTime;

        if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
          // User has been inactive for more than 8 hours
          console.log('⏰ Auto logout due to inactivity');
          handleLogout();
        }
      }
    };

    // Update last activity timestamp
    const updateActivity = () => {
      localStorage.setItem('adminLastActivity', Date.now().toString());
    };

    const handleLogout = async () => {
      try {
        await signOut(auth);
        localStorage.removeItem('adminLastActivity');
        router.push('/admin/login');
      } catch (error) {
        console.error('Error during auto logout:', error);
      }
    };

    // Check on mount
    checkInactivity();

    // Update activity on user interactions
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    // Check periodically (every minute)
    const intervalId = setInterval(checkInactivity, 60 * 1000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(intervalId);
    };
  }, [router]);
}
