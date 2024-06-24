// src/App.tsx

import { useEffect, useState } from "react";
import "./App.css";

interface AppProps {
  accessToken: string | null;
}

const App: React.FC<AppProps> = ({ accessToken }) => {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!accessToken) {
        return;
      }

      const query = `
        query {
          orgMember {
            name
            roles {
              slug
            }
          }
        }
      `;

      const response = await fetch('https://mothertree.truffle.vip/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': accessToken,
        },
        body: JSON.stringify({ query }),
      });

      const result = await response.json();
      const orgMember = result.data.orgMember;

      if (orgMember) {
        const roles = orgMember.roles.map((role: { slug: string }) => role.slug);
        if (roles.includes('admin') || roles.includes('moderator')) {
          setUserName(orgMember.name);
        } else {
          setUserName('Unauthorized');
        }
      }
    };

    fetchUserInfo();
  }, [accessToken]);

  return <h1>Hello, {userName}</h1>;
};

export default App;
