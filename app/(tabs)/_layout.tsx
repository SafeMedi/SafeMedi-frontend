import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Foundation from "@expo/vector-icons/Foundation";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { LinearGradient } from "expo-linear-gradient";
import { Redirect, Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AuthGateView } from "@/components/AuthGateView";
import { palette } from "@/constants/design-tokens";
import { useAuthRouteState } from "@/hooks/use-auth-route-state";
import { useUserStore } from "@/stores/userStore";

const BG_PINK_LINE_STOPS = [0, 0.5, 1] as const;

export default function TabLayout() {
  const authState = useAuthRouteState();
  const user = useUserStore((s) => s.user);

  if (authState.kind === "loading") {
    return <AuthGateView kind="loading" />;
  }

  if (authState.kind === "error") {
    return <AuthGateView kind="error" onRetry={authState.retry} />;
  }

  if (authState.href !== "/(tabs)/dashboard") {
    return <Redirect href={authState.href} />;
  }

  if (!user) {
    return <AuthGateView kind="loading" />;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[...palette.bg_pink_line]}
        locations={[...BG_PINK_LINE_STOPS]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: palette.green,
          tabBarInactiveTintColor: palette.icon,
          headerShown: false,
          sceneStyle: { backgroundColor: "transparent" },
          tabBarStyle: {
            height: 60,
            paddingTop: 6,
            paddingBottom: 6,
          },
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "대시보드",
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="view-dashboard" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="manage"
          options={{
            title: "관리",
            tabBarIcon: ({ color }) => <Foundation name="graph-bar" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="scan"
          options={{
            title: "",
            tabBarIconStyle: {
              marginTop: -25,
              width: 48,
              height: 48,
            },
            tabBarIcon: ({ color }) => <MaterialIcons name="camera" size={48} color={color} />,
          }}
        />
        <Tabs.Screen
          name="nearby"
          options={{
            title: "주변 약국",
            tabBarIcon: ({ color }) => (
              <FontAwesome5 name="map-marker-alt" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "프로필",
            tabBarIcon: ({ color }) => <Ionicons name="person-sharp" size={24} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
