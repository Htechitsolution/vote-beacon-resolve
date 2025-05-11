
import React from "react";

interface HeadProps {
  title?: string;
  description?: string;
}

const Head: React.FC<HeadProps> = ({ 
  title = "The E-Voting Platform", 
  description = "A secure online voting platform for meetings and elections" 
}) => {
  // Since we can't use react-helmet, we'll update the document directly
  React.useEffect(() => {
    // Update the document title
    document.title = title;
    
    // Update the meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = description;
      document.head.appendChild(meta);
    }
  }, [title, description]);
  
  // This component doesn't render anything to the DOM
  return null;
};

export default Head;
