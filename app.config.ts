import type { ConfigContext, ExpoConfig } from "expo/config";

const KAKAO_LOGIN_PLUGIN_NAME = "@react-native-seoul/kakao-login";
const EXPO_BUILD_PROPERTIES_PLUGIN_NAME = "expo-build-properties";
const EXPO_LOCATION_PLUGIN_NAME = "expo-location";
const KAKAO_MAVEN_REPOSITORY = "https://devrepo.kakao.com/nexus/content/groups/public/";
const DEFAULT_APP_NAME = "safeMedi";
const DEFAULT_APP_SLUG = "safeMedi";
const LOCATION_USAGE_DESCRIPTION =
  "현재 위치를 기반으로 지도를 표시하기 위해 위치 접근 권한이 필요합니다.";
const KAKAO_NATIVE_APP_KEY = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY ?? "";

type PluginEntry = NonNullable<ExpoConfig["plugins"]>[number];

function getPluginName(plugin: PluginEntry): string {
  return Array.isArray(plugin) ? String(plugin[0]) : String(plugin);
}

function stripManagedPlugins(plugins: readonly PluginEntry[]): PluginEntry[] {
  return plugins.filter((plugin) => {
    const pluginName = getPluginName(plugin);
    return (
      pluginName !== KAKAO_LOGIN_PLUGIN_NAME &&
      pluginName !== EXPO_BUILD_PROPERTIES_PLUGIN_NAME &&
      pluginName !== EXPO_LOCATION_PLUGIN_NAME
    );
  });
}

const KAKAO_MAP_ATS_EXCEPTION_DOMAINS = {
  "t1.daumcdn.net": {
    NSIncludesSubdomains: true,
    NSExceptionAllowsInsecureHTTPLoads: true,
  },
  "map.daumcdn.net": {
    NSIncludesSubdomains: true,
    NSExceptionAllowsInsecureHTTPLoads: true,
  },
  "mts.daumcdn.net": {
    NSIncludesSubdomains: true,
    NSExceptionAllowsInsecureHTTPLoads: true,
  },
} as const;

/** EXPO_PUBLIC_API_BASE_URL 이 http:// 이면 개발용 cleartext 허용 */
function allowsInsecureHttp(): boolean {
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  return baseUrl?.startsWith("http://") ?? false;
}

function getApiHostAtsException(): Record<string, { NSExceptionAllowsInsecureHTTPLoads: true }> {
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (!baseUrl?.startsWith("http://")) {
    return {};
  }

  try {
    const host = new URL(baseUrl).hostname;
    return {
      [host]: {
        NSExceptionAllowsInsecureHTTPLoads: true,
      },
    };
  } catch {
    return {};
  }
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const existingPlugins = stripManagedPlugins((config.plugins ?? []) as PluginEntry[]);
  const existingInfoPlist = config.ios?.infoPlist ?? {};
  const insecureHttpAllowed = allowsInsecureHttp();

  return {
    ...config,
    name: config.name ?? DEFAULT_APP_NAME,
    slug: config.slug ?? DEFAULT_APP_SLUG,
    ios: {
      ...config.ios,
      infoPlist: {
        ...existingInfoPlist,
        NSAppTransportSecurity: {
          NSAllowsLocalNetworking: true,
          ...(insecureHttpAllowed ? { NSAllowsArbitraryLoads: true } : {}),
          NSExceptionDomains: {
            ...KAKAO_MAP_ATS_EXCEPTION_DOMAINS,
            ...getApiHostAtsException(),
          },
        },
        NSLocationWhenInUseUsageDescription:
          existingInfoPlist.NSLocationWhenInUseUsageDescription ?? LOCATION_USAGE_DESCRIPTION,
        NSLocationAlwaysAndWhenInUseUsageDescription:
          existingInfoPlist.NSLocationAlwaysAndWhenInUseUsageDescription ??
          LOCATION_USAGE_DESCRIPTION,
      },
    },
    plugins: [
      "./plugins/withIosNetworkSessionFix.js",
      "./plugins/withIosKakaoAppDelegateFix.js",
      ...existingPlugins,
      [
        KAKAO_LOGIN_PLUGIN_NAME,
        {
          kakaoAppKey: KAKAO_NATIVE_APP_KEY,
          kotlinVersion: "2.1.20",
        },
      ],
      [
        EXPO_BUILD_PROPERTIES_PLUGIN_NAME,
        {
          android: {
            ...(insecureHttpAllowed ? { usesCleartextTraffic: true } : {}),
            extraMavenRepos: [KAKAO_MAVEN_REPOSITORY],
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
