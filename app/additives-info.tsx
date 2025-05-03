import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function AdditivesInfoScreen() {
  const router = useRouter();

  const riskColors = {
    high: "#F44336", // Rojo
    moderate: "#FF9800", // Naranja
    low: "#FFEB3B", // Amarillo
    none: "#4CAF50", // Verde
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Información sobre Aditivos</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Explicación sobre aditivos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            ¿Qué son los aditivos alimentarios?
          </Text>
          <Text style={styles.paragraph}>
            Los aditivos alimentarios son sustancias que se añaden a los
            alimentos para mantener o mejorar su seguridad, frescura, sabor,
            textura o apariencia. La Unión Europea utiliza el sistema de códigos
            "E" para identificarlos.
          </Text>
        </View>

        {/* Tipos de aditivos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipos de aditivos</Text>

          <View style={styles.additiveType}>
            <Text style={styles.additiveTypeTitle}>Colorantes (E100-E199)</Text>
            <Text style={styles.additiveDescription}>
              Modifican o dan color a los alimentos. Ejemplos incluyen la
              curcumina (E100), el carmín (E120) y los carotenoides (E160).
            </Text>
          </View>

          <View style={styles.additiveType}>
            <Text style={styles.additiveTypeTitle}>
              Conservantes (E200-E299)
            </Text>
            <Text style={styles.additiveDescription}>
              Prolongan la vida útil del producto inhibiendo el crecimiento
              microbiano. Incluyen ácido sórbico (E200), nitritos (E250) y
              sulfitos (E220).
            </Text>
          </View>

          <View style={styles.additiveType}>
            <Text style={styles.additiveTypeTitle}>
              Antioxidantes (E300-E399)
            </Text>
            <Text style={styles.additiveDescription}>
              Evitan la oxidación y enranciamiento, protegiendo los nutrientes.
              Incluyen vitamina C (E300), BHA (E320) y BHT (E321).
            </Text>
          </View>

          <View style={styles.additiveType}>
            <Text style={styles.additiveTypeTitle}>
              Estabilizantes/Espesantes (E400-E499)
            </Text>
            <Text style={styles.additiveDescription}>
              Mantienen la consistencia y textura de los alimentos. Ejemplos son
              los carragenanos (E407), goma guar (E412) y xantana (E415).
            </Text>
          </View>

          <View style={styles.additiveType}>
            <Text style={styles.additiveTypeTitle}>
              Reguladores de acidez (E500-E599)
            </Text>
            <Text style={styles.additiveDescription}>
              Controlan la acidez o alcalinidad de los alimentos. Incluyen
              carbonato de sodio (E500) y carbonato de potasio (E501).
            </Text>
          </View>

          <View style={styles.additiveType}>
            <Text style={styles.additiveTypeTitle}>
              Potenciadores del sabor (E600-E699)
            </Text>
            <Text style={styles.additiveDescription}>
              Intensifican el sabor de los alimentos. El ejemplo más conocido es
              el glutamato monosódico (E621).
            </Text>
          </View>

          <View style={styles.additiveType}>
            <Text style={styles.additiveTypeTitle}>
              Edulcorantes (E900-E999)
            </Text>
            <Text style={styles.additiveDescription}>
              Proporcionan dulzor con menos o ninguna caloría. Incluyen
              acesulfamo K (E950), aspartamo (E951) y sucralosa (E955).
            </Text>
          </View>
        </View>

        {/* Niveles de riesgo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Niveles de riesgo</Text>

          <View style={styles.riskLevelRow}>
            <View
              style={[
                styles.colorIndicator,
                { backgroundColor: riskColors.high },
              ]}
            />
            <View style={styles.riskInfo}>
              <Text style={styles.riskTitle}>Alto riesgo</Text>
              <Text style={styles.riskDescription}>
                Aditivos asociados con posibles efectos adversos significativos
                para la salud. Se recomienda evitar o limitar el consumo de
                alimentos que los contengan, especialmente para niños o personas
                con sensibilidades.
              </Text>
            </View>
          </View>

          <View style={styles.riskLevelRow}>
            <View
              style={[
                styles.colorIndicator,
                { backgroundColor: riskColors.moderate },
              ]}
            />
            <View style={styles.riskInfo}>
              <Text style={styles.riskTitle}>Riesgo moderado</Text>
              <Text style={styles.riskDescription}>
                Aditivos que pueden causar reacciones adversas en algunas
                personas o presentan evidencia menos concluyente de efectos a
                largo plazo. Se recomienda consumo ocasional.
              </Text>
            </View>
          </View>

          <View style={styles.riskLevelRow}>
            <View
              style={[
                styles.colorIndicator,
                { backgroundColor: riskColors.low },
              ]}
            />
            <View style={styles.riskInfo}>
              <Text style={styles.riskTitle}>Riesgo bajo</Text>
              <Text style={styles.riskDescription}>
                Aditivos que raramente producen efectos adversos pero podrían
                causar reacciones en personas muy sensibles. Se consideran
                generalmente seguros para la mayoría de las personas.
              </Text>
            </View>
          </View>

          <View style={styles.riskLevelRow}>
            <View
              style={[
                styles.colorIndicator,
                { backgroundColor: riskColors.none },
              ]}
            />
            <View style={styles.riskInfo}>
              <Text style={styles.riskTitle}>Sin riesgo conocido</Text>
              <Text style={styles.riskDescription}>
                Aditivos considerados seguros basándose en la evidencia
                científica disponible. La mayoría son de origen natural o
                idénticos a los compuestos naturales.
              </Text>
            </View>
          </View>
        </View>

        {/* Cálculo de la puntuación */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            ¿Cómo calculamos la puntuación?
          </Text>

          <Text style={styles.subtitle}>Puntuación total (0-100 puntos)</Text>
          <Text style={styles.paragraph}>
            La puntuación total combina tres aspectos clave de un producto:
          </Text>

          <View style={styles.scoreComponent}>
            <Text style={styles.scoreComponentTitle}>
              1. Valor nutricional (0-60 puntos)
            </Text>
            <Text style={styles.paragraph}>
              Basado principalmente en el Nutri-Score de cada producto:
            </Text>
            <View style={styles.scoreTable}>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreGrade}>A</Text>
                <Text style={styles.scorePoints}>60 puntos</Text>
                <Text style={styles.scoreDesc}>
                  Excelente perfil nutricional
                </Text>
              </View>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreGrade}>B</Text>
                <Text style={styles.scorePoints}>45 puntos</Text>
                <Text style={styles.scoreDesc}>Buen perfil nutricional</Text>
              </View>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreGrade}>C</Text>
                <Text style={styles.scorePoints}>30 puntos</Text>
                <Text style={styles.scoreDesc}>Perfil nutricional medio</Text>
              </View>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreGrade}>D</Text>
                <Text style={styles.scorePoints}>15 puntos</Text>
                <Text style={styles.scoreDesc}>Perfil nutricional pobre</Text>
              </View>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreGrade}>E</Text>
                <Text style={styles.scorePoints}>0 puntos</Text>
                <Text style={styles.scoreDesc}>
                  Perfil nutricional muy pobre
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.scoreComponent}>
            <Text style={styles.scoreComponentTitle}>
              2. Aditivos (0-30 puntos)
            </Text>
            <Text style={styles.paragraph}>
              Los productos sin aditivos reciben la puntuación máxima (30
              puntos). Por cada aditivo detectado, se reduce la puntuación según
              su nivel de riesgo:
            </Text>
            <View style={styles.indentedText}>
              <Text>• Aditivo de alto riesgo: -10 puntos</Text>
              <Text>• Aditivo de riesgo moderado: -3 puntos</Text>
              <Text>• Aditivo de bajo riesgo: -2 puntos</Text>
            </View>
            <Text style={styles.paragraph}>
              Además, productos que contienen al menos un aditivo de alto riesgo
              tienen una puntuación máxima limitada a 19 puntos en esta
              categoría.
            </Text>
          </View>

          <View style={styles.scoreComponent}>
            <Text style={styles.scoreComponentTitle}>
              3. Producción ecológica (0-10 puntos)
            </Text>
            <Text style={styles.paragraph}>
              Se asignan 10 puntos a productos certificados como orgánicos o
              ecológicos, identificados por etiquetas específicas.
            </Text>
          </View>

          <Text style={styles.subtitle}>
            Interpretación de la puntuación final
          </Text>
          <View style={styles.scoreTable}>
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreRange, { color: "#4CAF50" }]}>
                75-100
              </Text>
              <Text style={styles.scoreVerdict}>Excelente</Text>
              <Text style={styles.scoreDesc}>Producto muy recomendable</Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreRange, { color: "#8BC34A" }]}>
                50-74
              </Text>
              <Text style={styles.scoreVerdict}>Bueno</Text>
              <Text style={styles.scoreDesc}>Buena elección</Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreRange, { color: "#FF9800" }]}>
                25-49
              </Text>
              <Text style={styles.scoreVerdict}>Regular</Text>
              <Text style={styles.scoreDesc}>Consumo ocasional</Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreRange, { color: "#F44336" }]}>
                0-24
              </Text>
              <Text style={styles.scoreVerdict}>Malo</Text>
              <Text style={styles.scoreDesc}>
                Mejor considerar alternativas
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.disclaimerSection}>
          <Ionicons name="information-circle" size={24} color="#6D9EBE" />
          <Text style={styles.disclaimerText}>
            Esta información es orientativa y se basa en estudios científicos
            actuales. La puntuación no reemplaza el consejo médico o nutricional
            personalizado.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#1F1F3C",
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 16,
  },
  additiveType: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#6D9EBE",
  },
  additiveTypeTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  additiveDescription: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
  },
  riskLevelRow: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-start",
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
    marginTop: 4,
  },
  riskInfo: {
    flex: 1,
  },
  riskTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  riskDescription: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  scoreComponent: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  scoreComponentTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  indentedText: {
    paddingLeft: 16,
    marginBottom: 12,
  },
  scoreTable: {
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
  },
  scoreRow: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  scoreGrade: {
    width: 40,
    fontWeight: "bold",
    fontSize: 16,
  },
  scoreRange: {
    width: 60,
    fontWeight: "bold",
    fontSize: 16,
  },
  scorePoints: {
    width: 80,
    fontSize: 16,
  },
  scoreVerdict: {
    width: 80,
    fontWeight: "600",
    fontSize: 16,
  },
  scoreDesc: {
    flex: 1,
    fontSize: 16,
  },
  disclaimerSection: {
    marginTop: 24,
    flexDirection: "row",
    backgroundColor: "#EAF2F8",
    padding: 16,
    borderRadius: 8,
  },
  disclaimerText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
    color: "#555",
    fontStyle: "italic",
  },
});
