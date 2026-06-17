import type { ConfigContext, ExpoConfig } from "expo/config";

interface AppConfigModule {
  readonly default: (context: ConfigContext) => ExpoConfig;
}

function createConfigContext(config: ExpoConfig): ConfigContext {
  const projectRoot = process.cwd();
  return {
    config,
    projectRoot,
    staticConfigPath: `${projectRoot}/app.json`,
    packageJsonPath: `${projectRoot}/package.json`,
  };
}

function loadAppConfigModule(): AppConfigModule {
  let loadedModule: AppConfigModule | null = null;

  jest.isolateModules(() => {
    loadedModule = require("../../app.config") as AppConfigModule;
  });

  if (!loadedModule) {
    throw new Error("app.config module could not be loaded");
  }

  return loadedModule;
}

function getPluginName(plugin: NonNullable<ExpoConfig["plugins"]>[number]): string {
  return Array.isArray(plugin) ? String(plugin[0]) : String(plugin);
}

function restoreEnvValue(key: string, Value: string | undefined): void {
  if (Value === undefined) {
    delete process.env[key];
    return;
  }
  process.env[key] = Value;
}

describe("app.config", () => {
  const originalKakaoAppKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;

  afterEach(() => {
    restoreEnvValue("EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY", originalKakaoAppKey);
    jest.resetModules();
  });

  it("기존 managed plugin을 제거하고 필요한 plugin을 추가한다", () => {
    process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY = "test-kakao-app-key";
    const configFactory = loadAppConfigModule().default;

    const result = configFactory(
      createConfigContext({
        name: "safeMedi-dev",
        slug: "safeMedi-dev",
        plugins: [
          "expo-font",
          "@react-native-seoul/kakao-login",
          "expo-location",
          "expo-build-properties",
        ],
        ios: {
          infoPlist: {
            ExistingFlag: "keep",
          },
        },
      } as ExpoConfig),
    );

    expect(result.plugins?.[0]).toBe("./plugins/withIosKakaoAppDelegateFix.js");
    expect(result.plugins).toEqual(
      expect.arrayContaining([
        "expo-font",
        [
          "@react-native-seoul/kakao-login",
          { kakaoAppKey: "test-kakao-app-key", kotlinVersion: "2.1.20" },
        ],
        [
          "expo-build-properties",
          {
            android: {
              extraMavenRepos: ["https://devrepo.kakao.com/nexus/content/groups/public/"],
            },
          },
        ],
        [
          "expo-location",
          {
            locationAlwaysAndWhenInUsePermission:
              "현재 위치를 기반으로 지도를 표시하기 위해 위치 접근 권한이 필요합니다.",
            locationWhenInUsePermission:
              "현재 위치를 기반으로 지도를 표시하기 위해 위치 접근 권한이 필요합니다.",
          },
        ],
      ]),
    );

    const buildPropertiesEntries =
      result.plugins?.filter((plugin) => getPluginName(plugin) === "expo-build-properties") ?? [];
    expect(buildPropertiesEntries).toHaveLength(1);

    expect(result.ios?.infoPlist).toEqual(
      expect.objectContaining({
        ExistingFlag: "keep",
        NSAppTransportSecurity: {
          NSAllowsLocalNetworking: true,
          NSExceptionDomains: {
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
          },
        },
        NSLocationWhenInUseUsageDescription:
          "현재 위치를 기반으로 지도를 표시하기 위해 위치 접근 권한이 필요합니다.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "현재 위치를 기반으로 지도를 표시하기 위해 위치 접근 권한이 필요합니다.",
      }),
    );
  });

  it("name/slug/infoPlist 값이 없으면 기본값을 채운다", () => {
    process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY = "";
    const configFactory = loadAppConfigModule().default;

    const result = configFactory(
      createConfigContext({
        plugins: [],
      } as unknown as ExpoConfig),
    );

    expect(result.name).toBe("safeMedi");
    expect(result.slug).toBe("safeMedi");
    expect(result.ios?.infoPlist).toEqual(
      expect.objectContaining({
        NSLocationWhenInUseUsageDescription:
          "현재 위치를 기반으로 지도를 표시하기 위해 위치 접근 권한이 필요합니다.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "현재 위치를 기반으로 지도를 표시하기 위해 위치 접근 권한이 필요합니다.",
      }),
    );
  });
});
