
import { useEffect } from "react";
import { useAuthContext } from "../contexts/AuthContext";

import { api } from "../services/apiClient";
import { setupAPIClient } from "../services/setupAPIClient";
import { withSSRAuth } from "../utils/withSSRAuth";

export default function Dashboard() {

    const { user, signOut } = useAuthContext();

    useEffect(() => {
        api.get('/me')
            .then(response => console.log(`Return effect dashboard ${response}`))
    }, [])

    return (
        <>
            <h1>Dashboard {user?.email}</h1>

            <button onClick={signOut}>Sign Out</button>
        </>
    );
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
    const apiClient = setupAPIClient(ctx);

    const response = await apiClient.get('/me');
    console.log(`Return withSSRAuth ${JSON.stringify(response.data)}`);

    return { props: {} };
});