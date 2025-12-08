import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProviderProfile from '../components/ProviderProfile';

export default function ProviderProfileRoute() {
    const { provider } = useLocalSearchParams();
    const data = JSON.parse(provider as string);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={AppColors.text.secondary} />
                </Pressable>
                <Text style={styles.headerTitle}>Perfil do Prestador</Text>
                <View style={styles.placeholder} />
            </View>

            <ProviderProfile data={data} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.background.light,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: AppColors.background.default,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.border.muted,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: AppColors.text.secondary,
    },
    placeholder: {
        width: 32,
    },
});
