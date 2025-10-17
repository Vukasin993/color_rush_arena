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
}

export const ColorButtons: React.FC<ColorButtonsProps> = ({
  colors,
  onColorPress,
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
              borderColor: color.value,
              width: colors?.length > 4 ? "35%" : "48%",
            },
          ]}
          onPress={() => onColorPress(color)}
          activeOpacity={0.7}
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
                  width: colors?.length > 4 ? 24 : 40,
                  height: colors?.length > 4 ? 24 : 40,
                },
              ]}
            />
            <Text style={[styles.colorButtonText, { color: color.textColor, fontSize: colors?.length > 4 ? 12 : 16 }]}>
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
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  colorButton: {
    aspectRatio: 1.2,
    borderRadius: 15,
    borderWidth: 2,
    overflow: "hidden",
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 12,
  },
  colorButtonGradient: {
    flex: 1,
    padding: 15,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 13,
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
