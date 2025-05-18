import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const RecipeGeneratorButton = () => {
    const navigation = useNavigation();

    const navigateToRecipeGenerator = () => {
        navigation.navigate('RecipeGenerator');
    };

    return (
        <TouchableOpacity
            style={styles.button}
            onPress={navigateToRecipeGenerator}
        >
            <Text style={styles.buttonText}>Recipe Generator</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#5c6bc0',
        padding: 10,
        borderRadius: 8,
        margin: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default RecipeGeneratorButton;
