import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type ProviderProfileScreenProps = {
    data: {
        id: string;
        name: string;
        image: string;
        review: number;
        rating: number;
        about: string;

        reviews: {
            author: string;
            comment: string;
            rating: number;
        }[];
        gallery: string[];
    };
};

export default function ProviderProfileScreen({ data }: ProviderProfileScreenProps) {
    const [imageError, setImageError] = useState(false);
    const [failedGallery, setFailedGallery] = useState<number[]>([]);

    const getInitials = (name?: string) => {
        if (!name) return '';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    const showFallback = !data?.image || imageError || data.image === '';

    return (
        <ScrollView contentContainerStyle={styles.container}>

        {/* Profile */}
        {showFallback ? (
            <View style={styles.avatarFallback} accessible accessibilityLabel={data.name}>
                <Text style={styles.avatarFallbackText}>
                    {getInitials(data.name)}
                </Text>
            </View>
        ) : (
            <Image
                source={{ uri: data.image }}
                style={styles.avatar}
                onError={() => setImageError(true)}
                onLoad={() => setImageError(false)}
                accessibilityLabel={data.name}
                {...(Platform.OS === 'web' ? ({ alt: data.name } as any) : {})}
            />
        )}

        {/* Name */}
        <Text style={styles.name}>{data.name}</Text>

        {/* Rating */}
        <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color={AppColors.palette.amber.base} />
            <Text style={styles.ratingValue}>{data.rating.toFixed(1)}</Text>
            <Text style={styles.reviewsText}>({data.review} avaliações)</Text>
        </View>

        {/* Contact Button */}
        <Pressable
            style={styles.contactButton}
            onPress={() =>
                router.push({
                    pathname: '/ProviderChatTab',
                    params: {
                        provider: JSON.stringify(data),
                    },
                })
            }
        >
            <View style={styles.contactButtonContent}>
                <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
                <Text style={styles.contactButtonText}>Entrar em Contato</Text>
            </View>
        </Pressable>

        {/* About Section */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre</Text>
            <Text style={styles.sectionText}>
                {data.about}
            </Text>
        </View>

        {/* Reviews Session */}
        <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionTitle}>Avaliações de Clientes</Text>
            <View style={styles.section}>
                <View>
                    {data.reviews.length === 0 ? (
                        <Text style={styles.text}>Nenhuma avaliação ainda.</Text>
                        ) : (
                        data.reviews.map((review, index) => (
                            <View key={`${index}-${review.author}`} style={styles.reviewItem}>
                            <View style={styles.reviewHeader}>
                                <Text style={styles.reviewName}>{review.author}</Text>
                                <View style={styles.starsRow}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Ionicons
                                        key={star}
                                        name={star <= review.rating ? "star" : "star-outline"}
                                        size={14}
                                        color={AppColors.palette.amber.base}
                                        style={styles.starIcon}
                                        />
                                    ))}
                                </View>
                            </View>

                            <Text style={styles.reviewText}>{review.comment}</Text>
                            <View style={styles.separator} />
                            </View>
                        ))
                        )}

                </View>
            </View>
        </View>
        {/* Galery */}
        {data.gallery && data.gallery.length > 0 && (
            <View style={{ marginTop: 20 }}>
                <Text style={styles.sectionTitle}>Galeria de Serviços</Text>

                <View style={styles.section}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginTop: 10 }}
                    >
                        {data.gallery.map((imageUri, index) => {
                        const failed = failedGallery.includes(index) || !imageUri || imageUri === '';
                        return failed ? (
                            <View
                                key={index}
                                style={styles.galleryFallback}
                                accessible
                                accessibilityLabel={`${data.name} - foto indisponível ${index + 1}`}>
                                <View style={styles.galleryFallbackContent}>
                                    <Ionicons name="image" size={18} color="#6B7280" />
                                    <Text style={styles.galleryFallbackText}>Foto do serviço de {data.name}</Text>
                                </View>
                            </View>
                        ) : (
                            <Image
                                key={index}
                                source={{ uri: imageUri }}
                                style={styles.galleryImage}
                                onError={() => setFailedGallery(prev => (prev.includes(index) ? prev : [...prev, index]))}
                                accessibilityLabel={`${data.name} - foto ${index + 1}`}
                                {...(Platform.OS === 'web' ? ({ alt: `${data.name} - foto ${index + 1}` } as any) : {})}
                            />
                        );
                        })}
                    </ScrollView>
                </View>
            </View>
        )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingBottom: 80,
    },

    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignSelf: 'center',
        marginBottom: 16,
    },
    avatarFallback: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignSelf: 'center',
        marginBottom: 16,
        backgroundColor: '#9CA3AF',  
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
    },

    avatarFallbackText: {
        textAlign: 'center',
        fontSize: 32,
        color: '#FFFFFF',  
        fontWeight: '700',
    },

    name: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        color: AppColors.text.secondary,
    },

    ratingRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 6,
        gap: 6,
    },

    ratingValue: {
        fontSize: 15,
        fontWeight: '700',
        color: AppColors.palette.amber.base,
    },

    reviewsText: {
        fontSize: 13,
    },
    contactButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    contactButton: {
        backgroundColor: '#14B8A6',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    contactButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },

    section: {
        backgroundColor: AppColors.background.default,
        padding: 16,
        borderRadius: 16,
        marginTop: 20,
        gap: 8,
    },

    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: AppColors.text.secondary,
    },

    sectionText: {
        marginTop: 6,
        fontSize: 16,
        color: '#4B5563',
        fontWeight: '400',
    },
    text: {
        marginTop: 6,
        fontSize: 16,
        textAlign: 'center',
        color: '#4B5563',
        fontWeight: '400',
    },

    review: {
        marginTop: 12,
    },

    reviewName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937'
    },

    reviewText: {
        fontSize: 14,
        color: '#4B5563',
        marginTop: 7,
    },

    galleryImage: {
        width: 120,
        height: 90,
        borderRadius: 10,
        marginRight: 12,
    },
    galleryFallback: {
        width: 120,
        height: 90,
        borderRadius: 10,
        marginRight: 12,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    galleryFallbackContent: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    galleryFallbackText: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 0,
        marginTop: 6,
        textAlign: 'center',
    },
    reviewItem: {
        marginBottom: 16,
    },

    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    starsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    starIcon: {
        marginRight: 4, 
    },

    separator: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginTop: 12,
    },

});
