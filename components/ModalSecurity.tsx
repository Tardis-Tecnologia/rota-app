import { AppColors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface ModalDocumentsProps {
    visible: boolean;
    onClose: () => void;
}

export function ModalDocuments({ visible, onClose }: ModalDocumentsProps) {
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");

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
                        <Text style={styles.sheetTitle}>Segurança</Text>
                        <Text style={styles.sheetSubtitle}>
                            Denúncias e informações de segurança para a cidade.
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
                        <Text style={styles.fieldLabel}>Assunto do relato</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Iluminação pública no Bairro X"
                            placeholderTextColor={AppColors.gray[500]}
                            value={subject}
                            onChangeText={setSubject}
                        />

                        <Text style={[styles.fieldLabel, styles.fieldLabelMargin]}>
                            Descreva o ocorrido
                        </Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Informe data, horário, local e detalhes do que aconteceu para que possamos atuar."
                            placeholderTextColor={AppColors.gray[500]}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />

                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleSubmit}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="send" size={20} color="#FFFFFF" />
                            <Text style={styles.submitButtonText}>Enviar relato</Text>
                        </TouchableOpacity>
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
        marginBottom: 16,
    },
    formContent: {
        paddingBottom: 40,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1F2937",
        marginBottom: 8,
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
});
