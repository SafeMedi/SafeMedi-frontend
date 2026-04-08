import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Foundation from "@expo/vector-icons/Foundation";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useUserProfile } from "@/api/queries/user";
import { palette } from "@/constants/design-tokens";
import { useSessionStore } from "@/stores/sessionStore";
import { useUserStore } from "@/stores/userStore";

export default function TabLayout() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const user = useUserStore((s) => s.user);
  const { isPending } = useUserProfile();

  if (!accessToken) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isPending || !user) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.green,
        tabBarInactiveTintColor: palette.icon,
        headerShown: false,
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
          tabBarIcon: ({ color }) => <FontAwesome5 name="map-marker-alt" size={24} color={color} />,
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
  );
}
