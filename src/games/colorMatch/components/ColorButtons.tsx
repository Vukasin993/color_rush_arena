import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts, Orbitron_700Bold } from "@expo-google-fonts/orbitron";

interface ColorData {
  name: string;
  value: string;
  textColor: string;
}

interface ColorButtonsProps {
  colors: ColorData[];
  onColorPress: (color: ColorData) => void;
  isEndless?: boolean;
}

export const ColorButtons: React.FC<ColorButtonsProps> = ({
  colors,
  onColorPress,
  isEndless = false,
}) => {
  const [fontsLoaded] = useFonts({
    Orbitron_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <View style={styles.buttonsContainer}>
      {colors.map((color) => (
        <TouchableOpacity
          key={color.name}
          style={[
            styles.colorButton,
            {
              width:
                colors?.length === 6
                  ? isEndless ? "35%" : "45%"
                  : colors?.length > 6
                  ? "30%"
                  : colors?.length > 4
                  ? "35%"
                  : "48%",
            },
          ]}
          onPress={() => onColorPress(color)}
          activeOpacity={0.8}
          hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
        >
          <LinearGradient
            colors={[`${color.value}20`, `${color.value}10`]}
            style={styles.colorButtonGradient}
          >
            <View
              style={[
                styles.colorButtonInner,
                {
                  backgroundColor: color.value,
                  width:
                    colors?.length === 6
                      ? 30
                      : colors?.length > 6
                      ? 20
                      : colors?.length > 4
                      ? 24
                      : 40,
                  height:
                    colors?.length === 6
                      ? 30
                      : colors?.length > 6
                      ? 20
                      : colors?.length > 4
                      ? 24
                      : 40,
                },
              ]}
            />
            <Text
              style={[
                styles.colorButtonText,
                {
                  color: color.textColor,
                  fontSize:
                    colors?.length === 6
                      ? 14
                      : colors?.length > 6
                      ? 10
                      : colors?.length > 4
                      ? 12
                      : 16,
                },
              ]}
            >
              {color.name}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  buttonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 10,
  },
  colorButton: {
    aspectRatio: 1.2,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    overflow: "hidden",
    marginBottom: 12,
    minHeight: 80,
  },
  colorButtonGradient: {
    flex: 1,
    padding: 18,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 13,
    minHeight: 78,
  },
  colorButtonInner: {
    borderRadius: 20,
    marginBottom: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  colorButtonText: {
    fontFamily: "Orbitron_700Bold",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
