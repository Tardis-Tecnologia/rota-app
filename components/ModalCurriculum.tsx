import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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

interface ModalCurriculumProps {
    visible: boolean;
    onClose: () => void;
}

export function ModalCurriculum({ visible, onClose }: ModalCurriculumProps) {
    const [skills, setSkills] = useState(["Eletricista", "Encanador", "PrimeirosSocorros"]);
    const [newSkill, setNewSkill] = useState("");

    const addSkill = () => {
        if (!newSkill.trim()) return;
        setSkills([...skills, newSkill.trim()]);
        setNewSkill("");
    };

    const removeSkill = (skill: string) => {
        setSkills(skills.filter((item) => item !== skill));
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

                    {/* HEADER */}
                    <View style={styles.sheetHeader}>
                        <Text style={styles.sheetTitle}>Meu Currículo</Text>
                        <Text style={styles.sheetSubtitle}>
                            Adicione suas habilidades para receber vagas compatíveis
                        </Text>

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                        >
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                    >

                        {/* MY SKILLS */}
                        <Text style={styles.sectionTitle}>Minhas Habilidades</Text>

                        <View style={styles.tagsContainer}>
                            {skills.map((skill) => (
                                <View key={skill} style={styles.tag}>
                                    <Text style={styles.tagText}>#{skill}</Text>

                                    <TouchableOpacity onPress={() => removeSkill(skill)}>
                                        <Ionicons name="close" size={15} color="#4f46e5" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>

                        {/* ADD NEW SKILL */}
                        <View style={styles.addSkillCard}>
                            <Text style={styles.sectionTitleCard}>Adicionar Nova Habilidade</Text>

                            <View style={styles.addSkillContainer}>
                                <TextInput
                                    placeholder="Ex: Pintor, Excel, Inglês..."
                                    placeholderTextColor="#9CA3AF"
                                    value={newSkill}
                                    onChangeText={setNewSkill}
                                    style={styles.input}
                                />

                                <TouchableOpacity style={styles.addButton} onPress={addSkill}>
                                    <Ionicons name="add" size={22} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.helperText}>
                                Quanto mais habilidades, mais vagas você receberá!
                            </Text>
                        </View>

                        {/* GREEN BANNER */}
                        <LinearGradient
                            colors={["#2dd4bf", "#4ade80"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.greenBanner}
                        >
                            <View style={styles.bannerIcon}>
                                <Ionicons name="trending-up" size={24} color="#FFFFFF" />
                            </View>
                            <View style={styles.bannerContent}>
                                <Text style={styles.bannerNumber}>3 vagas compatíveis</Text>
                                <Text style={styles.bannerText}>Baseado no seu perfil</Text>
                            </View>
                        </LinearGradient>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
        justifyContent: "flex-end",
    },
    backdropTouchableArea: { flex: 1 },

    bottomSheet: {
        backgroundColor: "#FFFFFF",
        paddingTop: 24,
        paddingHorizontal: 24,
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        maxHeight: "85%",
    },

    sheetHeader: {
        marginBottom: 22,
        position: "relative",
        paddingRight: 32,
    },
    sheetTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
    },
    sheetSubtitle: {
        fontSize: 13,
        marginTop: 4,
        color: "#6B7280",
        width: "85%",
    },
    closeButton: {
        position: "absolute",
        right: -5,
        top: -4,
        padding: 8,
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginTop: 10,
        marginBottom: 10,
        color: "#374151",
    },

    tagsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 20,
    },
    tag: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#e0e7ff",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    tagText: {
        fontSize: 14,
        color: "#4f46e5",
        fontWeight: "500",
    },

    addSkillCard: {
        backgroundColor: "#F9FAFB",
        borderRadius: 16,
        padding: 16,
        marginTop: 4,
    },
    sectionTitleCard: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 12,
        color: "#374151",
    },
    addSkillContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: "#111827",
    },
    addButton: {
        backgroundColor: "#14b8a6",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    helperText: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 8,
    },

    greenBanner: {
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    bannerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    bannerContent: {
        flex: 1,
    },
    bannerNumber: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    bannerText: {
        fontSize: 14,
        color: "#FFFFFF",
        opacity: 0.9,
        marginTop: 2,
    },
});
