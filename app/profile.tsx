import { Redirect } from 'expo-router';

/** The old single-profile screen was replaced by family profiles (Epic 30). Kept as a redirect so
 *  any lingering link to /profile still lands somewhere sensible. */
export default function ProfileRoute() {
  return <Redirect href="/whos-playing" />;
}
