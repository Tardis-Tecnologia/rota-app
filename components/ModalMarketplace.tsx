import { AppColors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

interface ModalMarketplaceProps {
    visible: boolean;
    onClose: () => void;
}

const categories = [
    { id: "1", label: "Produtos locais" },
    { id: "2", label: "Serviços" },
    { id: "3", label: "Usados" },
    { id: "4", label: "Artesanato" },
];

export function ModalMarketplace({ visible, onClose }: ModalMarketplaceProps) {
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const handleSubmit = () => {
        // TODO: enviar relato
        console.log("Enviar relato:", { subject, description });
        setSubject("");
        setDescription("");
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalBackdrop}>
                <Pressable style={styles.backdropTouchableArea} onPress={onClose} />

                <View style={styles.bottomSheet}>
                    <View style={styles.sheetHeader}>
                        <Text style={styles.sheetTitle}>Marketplace</Text>
                        <Text style={styles.sheetSubtitle}>
                            Compre, venda e descubra produtos e serviços da sua região.
                        </Text>

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                        >
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.divider} />

                    <ScrollView
                        showsVerticalScrollIndicator={true}
                        contentContainerStyle={styles.formContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.descriptionContainer}>
                            <Ionicons
                                        name="bag-handle-outline"
                                        size={24}
                                        color="#6B7280"
                                        style={{ marginBottom: 8 }}
                                        />

                            <Text style={styles.descriptionTitle}>Em breve</Text>
                            <Text style={styles.textDescription}>O Marketplace está em construção. Em breve você poderá anunciar 
                                e encontrar produtos e serviços perto de você.
                            </Text>
                        </View>
                        <View style={styles.divider} />
                        <Text style={[styles.fieldLabel, styles.fieldLabelMargin]}>
                            Categorias que virão:
                        </Text>
                        
                        <View style={styles.categoriesContainer}>
                            {categories.map((category) => {
                                const isSelected = selectedCategory === category.id;
                                return (
                                <TouchableOpacity
                                    key={category.id}
                                    style={[
                                    styles.categoryChip,
                                    isSelected && styles.categoryChipSelected,
                                    ]}
                                    onPress={() => setSelectedCategory(category.id)}
                                >
                                    <Ionicons
                                    name="storefront-outline"
                                    size={14}
                                    color={isSelected ? "#FFFFFF" : "#6B7280"}
                                    style={{ marginRight: 6 }}
                                    />
                                    <Text
                                    style={[
                                        styles.categoryText,
                                        isSelected && styles.categoryTextSelected,
                                    ]}
                                    >
                                    {category.label}
                                    </Text>
                                </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>
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
        marginBottom: 12,
    },
    formContent: {
        paddingBottom: 40,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: AppColors.text.gray,
        marginBottom: 16,
        textAlign: "center",
    },
    descriptionContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    descriptionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: AppColors.text.primary,
        marginBottom: 8,
    },
    textDescription: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 16,
        textAlign: "center",
        lineHeight: 20,
        width: "66%",
    },
    fieldLabelMargin: {
        marginTop: 16,
    },
    input: {
        backgroundColor: "#F3F4F6",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        color: "#1F2937",
    },
    textArea: {
        minHeight: 100,
        paddingTop: 12,
    },
    submitButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#7C3AED",
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 24,
        gap: 8,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    categoriesContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
      },
      
      categoryChip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
      },
      
      categoryChipSelected: {
        backgroundColor: "#7C3AED",
        borderColor: "#7C3AED",
      },
      
      categoryText: {
        fontSize: 13,
        color: "#6B7280",
        fontWeight: "500",
      },
      
      categoryTextSelected: {
        color: "#FFFFFF",
      },
});
