import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { ModalDocuments } from './ModalDocuments';

interface MenuItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress?: () => void;
    variant?: 'default' | 'danger';
    iconColor?: string;
}

function MenuItem({ icon, label, onPress, variant = 'default', iconColor }: MenuItemProps) {
    const isDanger = variant === 'danger';
    const finalIconColor = isDanger ? AppColors.status.error : (iconColor || AppColors.gray[500]);

    return (
        <TouchableOpacity
        style={[styles.menuItem, isDanger && styles.menuItemDanger]}
        onPress={onPress}
        activeOpacity={0.7}
        >
        <View style={[styles.menuIconContainer]}>
            <Ionicons
            name={icon}
            size={24}
            color={finalIconColor}
            />
        </View>
        <Text style={[styles.menuLabel, isDanger && styles.menuLabelDanger]}>
            {label}
        </Text>
        </TouchableOpacity>
    );
}

interface ProfileComponentProps {
    nomeUsuario?: string;
    avatarUrl?: string;
    subtitulo?: string;
}

export default function ProfileComponent({
    nomeUsuario = 'Mariana Costa',
    avatarUrl = 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    subtitulo = 'Cidadã engajada',
}: ProfileComponentProps) {
    const [showDocumentosModal, setShowDocumentosModal] = useState(false);
    const handleMenuPress = (item: string) => {
        if (item === 'Conta' || item === 'Ajuda') {
            Alert.alert(item, 'Esta tela ainda está em desenvolvimento.');
            return;
        }
        if (item === 'Meus Documentos') {
            setShowDocumentosModal(true);
            return;
        }
        console.log(`Navegando para: ${item}`);
    };

    const handleSair = () => {
        console.log('Sair da conta');
    };

    return (
        <>
            <ModalDocuments
                visible={showDocumentosModal}
                onClose={() => setShowDocumentosModal(false)}
            />
            <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            >
            {/* Profile Picture */}
            <View style={styles.profileSection}>
                <View style={styles.avatarContainer}>
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                    <TouchableOpacity style={styles.cameraButton} activeOpacity={0.8}>
                        <Ionicons name="camera" size={14} color={AppColors.text.white} />
                    </TouchableOpacity>
                </View>

                {/* Name and Subtitle */}
                <Text style={styles.userName}>{nomeUsuario}</Text>
                <Text style={styles.userSubtitle}>{subtitulo}</Text>
            </View>

            {/* Menu Options */}
            <View style={styles.menuSection}>
                <MenuItem
                icon="person-outline"
                label="Conta"
                iconColor={AppColors.gray[500]}
                onPress={() => handleMenuPress('Conta')}
                />
                <MenuItem
                icon="document-text-outline"
                label="Meus Documentos"
                iconColor="#6366F1"
                onPress={() => handleMenuPress('Meus Documentos')}
                />
                <MenuItem
                icon="ribbon-outline"
                label="Meu Currículo"
                iconColor="#14B8A6"
                onPress={() => handleMenuPress('Meu Currículo')}
                />
                <MenuItem
                icon="help-circle-outline"
                label="Ajuda"
                iconColor={AppColors.gray[500]}
                onPress={() => handleMenuPress('Ajuda')}
                />
            </View>

            {/* Close Button */}
            <View style={styles.logoutSection}>
                <MenuItem
                icon="log-out-outline"
                label="Sair da Conta"
                onPress={handleSair}
                variant="danger"
                />
            </View>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingVertical: 24,
    },
    profileSection: {
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: AppColors.gray[200],
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: AppColors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: AppColors.background.default,
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        color: AppColors.text.secondary,
        marginBottom: 4,
    },
    userSubtitle: {
        fontSize: 16,
        fontWeight: '400',
        color: '#6B7280',
    },
    menuSection: {
        paddingHorizontal: 24,
        gap: 12,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: AppColors.background.default,
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    menuItemDanger: {
        backgroundColor: 'rgba(231, 76, 60, 0.08)',
        justifyContent: 'center',
    },
    menuIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    menuLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    menuLabelDanger: {
        color: AppColors.status.error,
        fontSize: 16,
    },
    logoutSection: {
        paddingHorizontal: 24,
        marginTop: 24,
    },
});

