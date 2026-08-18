import './PlaceholderScreen.css'

interface Props {
  title: string
  message: string
}

// A minimal landing spot for TaskBar destinations that don't have real
// functionality yet (Instructions, Chat, Team) — so clicking them goes
// somewhere real instead of doing nothing, without inventing features that
// weren't asked for.
function PlaceholderScreen({ title, message }: Props) {
  return (
    <div className="placeholder-screen">
      <div className="placeholder-content">
        <h1>{title}</h1>
        <p>{message}</p>
      </div>
    </div>
  )
}

export default PlaceholderScreen
