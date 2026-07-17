import { Link } from 'react-router-dom'
import PagePlaceholder from '../components/PagePlaceholder.jsx'
import PlaceholderLayout from '../layouts/PlaceholderLayout.jsx'

export default function NotFound() {
  return (
    <PlaceholderLayout>
      <PagePlaceholder title="This path is uncharted" description="The page you seek has vanished beyond the borders of the realm." eyebrow="404" />
      <Link className="button button--primary placeholder__home" to="/">Return home</Link>
    </PlaceholderLayout>
  )
}
