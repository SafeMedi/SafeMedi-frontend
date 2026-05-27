import type { ConfigContext, ExpoConfig } from "expo/config";

const NAVER_MAP_PLUGIN_NAME = "@mj-studio/react-native-naver-map";
const EXPO_BUILD_PROPERTIES_PLUGIN_NAME = "expo-build-properties";
const EXPO_LOCATION_PLUGIN_NAME = "expo-location";
const NAVER_MAP_MAVEN_REPOSITORY = "https://repository.map.naver.com/archive/maven";
const DEFAULT_APP_NAME = "safeMedi";
const DEFAULT_APP_SLUG = "safeMedi";
const LOCATION_USAGE_DESCRIPTION =
  "현재 위치를 기반으로 지도를 표시하기 위해 위치 접근 권한이 필요합니다.";
const NAVER_MAP_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID ?? "";

type PluginEntry = NonNullable<ExpoConfig["plugins"]>[number];

function getPluginName(plugin: PluginEntry): string {
  return Array.isArray(plugin) ? String(plugin[0]) : String(plugin);
}

function stripManagedPlugins(plugins: readonly PluginEntry[]): PluginEntry[] {
  return plugins.filter((plugin) => {
    const pluginName = getPluginName(plugin);
    return (
      pluginName !== NAVER_MAP_PLUGIN_NAME &&
      pluginName !== EXPO_BUILD_PROPERTIES_PLUGIN_NAME &&
      pluginName !== EXPO_LOCATION_PLUGIN_NAME
    );
  });
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const existingPlugins = stripManagedPlugins((config.plugins ?? []) as PluginEntry[]);
  const existingInfoPlist = config.ios?.infoPlist ?? {};

  return {
    ...config,
    name: config.name ?? DEFAULT_APP_NAME,
    slug: config.slug ?? DEFAULT_APP_SLUG,
    ios: {
      ...config.ios,
      infoPlist: {
        ...existingInfoPlist,
        NMFClientId: existingInfoPlist.NMFClientId ?? NAVER_MAP_CLIENT_ID,
        NMFNcpKeyId: existingInfoPlist.NMFNcpKeyId ?? NAVER_MAP_CLIENT_ID,
        NSLocationWhenInUseUsageDescription:
          existingInfoPlist.NSLocationWhenInUseUsageDescription ?? LOCATION_USAGE_DESCRIPTION,
        NSLocationAlwaysAndWhenInUseUsageDescription:
          existingInfoPlist.NSLocationAlwaysAndWhenInUseUsageDescription ??
          LOCATION_USAGE_DESCRIPTION,
      },
    },
    plugins: [
      ...existingPlugins,
      [
        NAVER_MAP_PLUGIN_NAME,
        {
          client_id: NAVER_MAP_CLIENT_ID,
        },
      ],
      [
        EXPO_BUILD_PROPERTIES_PLUGIN_NAME,
        {
          android: {
            extraMavenRepos: [NAVER_MAP_MAVEN_REPOSITORY],
          },
        },
      ],
      [
        EXPO_LOCATION_PLUGIN_NAME,
        {
          locationAlwaysAndWhenInUsePermission: LOCATION_USAGE_DESCRIPTION,
          locationWhenInUsePermission: LOCATION_USAGE_DESCRIPTION,
        },
      ],
    ],
  };
};
