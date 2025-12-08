import { useLocalSearchParams } from 'expo-router';
import ProviderProfile from '../components/ProviderProfile';

export default function ProviderProfileRoute() {
    const { provider } = useLocalSearchParams();
    const data = JSON.parse(provider as string);

    return <ProviderProfile data={data} />;
}
