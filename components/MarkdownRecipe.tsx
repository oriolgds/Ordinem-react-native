import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

interface MarkdownRecipeProps {
  content: string;
}

const MarkdownRecipe = ({ content }: MarkdownRecipeProps) => {
  // Separar el contenido por líneas
  const lines = content.split("\n");

  // Componente para procesar cada línea según el formato de Markdown
  const renderLine = (line: string, index: number) => {
    // Procesar encabezados
    if (line.startsWith("## ")) {
      return (
        <Text key={index} style={styles.heading2}>
          {line.substring(3)}
        </Text>
      );
    } else if (line.startsWith("# ")) {
      return (
        <Text key={index} style={styles.heading1}>
          {line.substring(2)}
        </Text>
      );
    }
    // Procesar listas
    else if (line.startsWith("* ") || line.startsWith("- ")) {
      return (
        <View key={index} style={styles.listItemContainer}>
          <Text style={styles.bulletPoint}>•</Text>
          <Text style={styles.listItem}>{line.substring(2)}</Text>
        </View>
      );
    }
    // Procesar listas numeradas
    else if (/^\d+\.\s/.test(line)) {
      const number = line.match(/^\d+/)[0];
      return (
        <View key={index} style={styles.listItemContainer}>
          <Text style={styles.numberPoint}>{number}.</Text>
          <Text style={styles.listItem}>
            {line.substring(number.length + 2)}
          </Text>
        </View>
      );
    }
    // Procesar líneas en blanco
    else if (line.trim() === "") {
      return <View key={index} style={styles.emptyLine} />;
    }
    // Procesar texto normal
    else {
      return (
        <Text key={index} style={styles.paragraph}>
          {line}
        </Text>
      );
    }
  };

  return (
    <View style={styles.container}>
      {lines.map((line, index) => renderLine(line, index))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  heading1: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 12,
    color: "#1F1F3C",
  },
  heading2: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#1F1F3C",
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginVertical: 8,
    color: "#333",
  },
  listItemContainer: {
    flexDirection: "row",
    marginVertical: 4,
    paddingLeft: 8,
  },
  bulletPoint: {
    fontSize: 16,
    marginRight: 10,
    color: "#6D9EBE",
    lineHeight: 24,
  },
  numberPoint: {
    fontSize: 16,
    marginRight: 8,
    color: "#6D9EBE",
    fontWeight: "500",
    width: 20,
    lineHeight: 24,
  },
  listItem: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  emptyLine: {
    height: 12,
  },
});

export default MarkdownRecipe;
