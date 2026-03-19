import { useState } from 'react';

interface StarRatingProps {
  rating: number;
  onRating: (rate: number) => void;
}

const starStyle: React.CSSProperties = {
  cursor: 'pointer',
  fontSize: '2.5rem',
  color: '#e0e0e0',
  margin: '0 4px',
  transition: 'color 0.2s',
};

const filledStarStyle: React.CSSProperties = {
  ...starStyle,
  color: '#ffc107'
};

export const StarRating = ({ rating, onRating }: StarRatingProps) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="star-rating" style={{ textAlign: 'center', padding: '10px 0' }}>
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <span
            key={ratingValue}
            style={ratingValue <= (hover || rating) ? filledStarStyle : starStyle}
            onClick={() => onRating(ratingValue)}
            onMouseEnter={() => setHover(ratingValue)}
            onMouseLeave={() => setHover(0)}
          >
            &#9733;
          </span>
        );
      })}
    </div>
  );
};