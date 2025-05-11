
import React from "react";
import { Helmet } from "react-helmet";

interface HeadProps {
  title?: string;
  description?: string;
}

const Head: React.FC<HeadProps> = ({
  title = "The E-Voting Platform",
  description = "A secure online voting platform for meetings and elections",
}) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link
        rel="icon"
        type="image/svg+xml"
        href="/favicon.svg"
      />
    </Helmet>
  );
};

export default Head;
