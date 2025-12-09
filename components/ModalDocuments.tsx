import { AppColors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface DocItemProps {
    label: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    iconBgColor: string;
}

function DocItem({ label, description, icon, iconColor, iconBgColor }: DocItemProps) {
    return (
        <View style={styles.docItem}>
            <View style={styles.docItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
                    <Ionicons name={icon} size={20} color={iconColor} />
                </View>
                <View style={styles.docTextContainer}>
                    <Text style={styles.docLabel}>{label}</Text>
                    <Text style={styles.docDescription}>{description}</Text>
                </View>
            </View>

            <TouchableOpacity onPress={() => console.log("Download:", label)}>
                <Ionicons name="download-outline" size={22} color="#4F46E5" />
            </TouchableOpacity>
        </View>
    );
}

interface ModalDocumentsProps {
    visible: boolean;
    onClose: () => void;
}

export function ModalDocuments({ visible, onClose }: ModalDocumentsProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalBackdrop}>
                {/* Close modal when tapping outside */}
                <Pressable style={styles.backdropTouchableArea} onPress={onClose} />

                {/* Content (bottom sheet) */}
                <View style={styles.bottomSheet}>
                    {/* Header */}
                    <View style={styles.sheetHeader}>
                        <Text style={styles.sheetTitle}>Meus Documentos</Text>
                        <Text style={styles.sheetSubtitle}>
                            Sua carteira digital de documentos oficiais.
                        </Text>

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                        >
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.divider} />

                    {/* Documents list */}
                    <View style={{ maxHeight: 410 }}>
                        <ScrollView
                            showsVerticalScrollIndicator={true}
                            contentContainerStyle={{ paddingBottom: 40 }}
                        >
                            <View style={styles.docsList}>
                                <DocItem
                                    label="Cópia Digital do IPTU"
                                    description="Válido até 31/12/2025"
                                    icon="home-outline"
                                    iconColor="#3B82F6"
                                    iconBgColor="#DBEAFE"
                                />
                                <DocItem
                                    label="Certidão Negativa de Débitos"
                                    description="Emitida em 20/11/2025"
                                    icon="checkmark-circle-outline"
                                    iconColor="#22C55E"
                                    iconBgColor="#DCFCE7"
                                />
                                <DocItem
                                    label="Comprovante de Residência Digital"
                                    description="Gerado via GPS • Válido por 90 dias"
                                    icon="location-outline"
                                    iconColor="#F59E0B"
                                    iconBgColor="#FEF3C7"
                                />
                                <DocItem
                                    label="Cartão SUS Digital"
                                    description="Atualizado"
                                    icon="medkit-outline"
                                    iconColor="#06B6D4"
                                    iconBgColor="#CFFAFE"
                                />
                                <DocItem
                                    label="Histórico Escolar - Sofia"
                                    description="Ano letivo 2025"
                                    icon="school-outline"
                                    iconColor="#8B5CF6"
                                    iconBgColor="#EDE9FE"
                                />
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    backdropTouchableArea: {
        flex: 1,
    },
    bottomSheet: {
        backgroundColor: "#F9FAFB",
        paddingTop: 24,
        paddingBottom: 40,
        paddingHorizontal: 24,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        elevation: 10,
    },
    sheetHeader: {
        marginBottom: 1,
        position: "relative",
        backgroundColor: "#F9FAFB",
        paddingBottom: 16,
    },
    sheetTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 6,
        color: "#1F2937",
    },
    sheetSubtitle: {
        fontSize: 14,
        marginTop: 4,
        color: AppColors.gray[500],
    },
    closeButton: {
        position: "absolute",
        right: 0,
        top: 0,
        padding: 8,
    },
    divider: {
        height: 1,
        backgroundColor: "#E5E7EB",
        marginBottom: 16,
    },
    docsList: {
        gap: 12,
    },
    docItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#F3F4F6",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    docItemLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
        marginRight: 12,
    },
    docTextContainer: {
        flex: 1,
        flexShrink: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    docLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1F2937",
    },
    docDescription: {
        fontSize: 12,
        color: AppColors.gray[500],
        marginTop: 2,
    },
});
