import { useEffect, useState } from 'react'
import { addToFavorites, checkIfFavorite, removeFromFavorites } from '../api/favorites'
import { useAuth } from '../context/AuthContext'

function FavoriteButton({ salonId, size = 'medium' }) {
  const { user } = useAuth()
  const [isFavorited, setIsFavorited] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return

    const checkFavorite = async () => {
      try {
        const data = await checkIfFavorite(salonId, user.id)
        setIsFavorited(data.is_favorited)
      } catch (err) {
        console.error('Error checking favorite status:', err)
      }
    }

    checkFavorite()
  }, [user, salonId])

  const handleToggleFavorite = async (e) => {
    e.stopPropagation()

    if (!user) {
      alert('Please log in to save favorites')
      return
    }

    setLoading(true)
    try {
      if (isFavorited) {
        await removeFromFavorites(user.id, salonId)
        setIsFavorited(false)
      } else {
        await addToFavorites(user.id, salonId)
        setIsFavorited(true)
      }
    } catch (err) {
      console.error('Error toggling favorite:', err)
      alert('Failed to update favorite status')
    } finally {
      setLoading(false)
    }
  }

  const sizeClass = `favorite-button-${size}`
  const heartIcon = isFavorited ? '❤️' : '🤍'

  return (
    <button
      type="button"
      className={`favorite-button ${sizeClass}`}
      onClick={handleToggleFavorite}
      disabled={loading}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <span className="heart-icon">{heartIcon}</span>
    </button>
  )
}

export default FavoriteButton
