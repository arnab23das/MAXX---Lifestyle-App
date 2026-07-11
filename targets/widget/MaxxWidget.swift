import WidgetKit
import SwiftUI

// Reads the JSON blob written by src/widgets/widgetData.ts (via
// @bacons/apple-targets' ExtensionStorage bridge) from the shared App Group
// container. Keep this struct's fields in sync with WidgetSnapshot in
// src/widgets/widgetData.ts.
struct MaxxWidgetSnapshot: Codable {
    var streak: Int
    var xp: Int
    var level: Int
    var credits: Int
    var xpFraction: Double
    var updatedAt: String
}

// Must match APP_GROUP_ID in src/widgets/config.ts exactly. Both derive from
// `group.<ios.bundleIdentifier>.widget` — update both if the bundle id changes.
let appGroupId = "group.com.maxx.app.widget"

func loadSnapshot() -> MaxxWidgetSnapshot {
    let fallback = MaxxWidgetSnapshot(streak: 0, xp: 0, level: 1, credits: 0, xpFraction: 0, updatedAt: "")
    guard let defaults = UserDefaults(suiteName: appGroupId),
          let data = defaults.data(forKey: "maxx.widget.snapshot") else {
        return fallback
    }
    return (try? JSONDecoder().decode(MaxxWidgetSnapshot.self, from: data)) ?? fallback
}

struct MaxxWidgetEntry: TimelineEntry {
    let date: Date
    let snapshot: MaxxWidgetSnapshot
}

struct MaxxWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> MaxxWidgetEntry {
        MaxxWidgetEntry(date: Date(), snapshot: MaxxWidgetSnapshot(streak: 4, xp: 120, level: 3, credits: 6, xpFraction: 0.4, updatedAt: ""))
    }

    func getSnapshot(in context: Context, completion: @escaping (MaxxWidgetEntry) -> Void) {
        completion(MaxxWidgetEntry(date: Date(), snapshot: loadSnapshot()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<MaxxWidgetEntry>) -> Void) {
        let entry = MaxxWidgetEntry(date: Date(), snapshot: loadSnapshot())
        // Data is pushed from the app on every gamification change (see
        // widgetData.ts), so a single-entry timeline is enough — the widget
        // reloads on demand via ExtensionStorage.reloadWidget().
        completion(Timeline(entries: [entry], policy: .never))
    }
}

struct MaxxHomeScreenView: View {
    var entry: MaxxWidgetEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("🔥 \(entry.snapshot.streak)")
                    .font(.system(size: 20, weight: .bold))
                Spacer()
                Text("🪙 \(entry.snapshot.credits)")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.secondary)
            }
            Text("Level \(entry.snapshot.level)")
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(.secondary)
            ProgressView(value: entry.snapshot.xpFraction)
                .tint(.accentColor)
        }
        .padding()
        .containerBackground(for: .widget) { Color("WidgetBackground") }
    }
}

struct MaxxLockScreenView: View {
    var entry: MaxxWidgetEntry

    var body: some View {
        VStack {
            Text("🔥")
            Text("\(entry.snapshot.streak)")
                .font(.system(size: 16, weight: .bold))
        }
        .containerBackground(for: .widget) { Color.clear }
    }
}

struct MaxxWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    var entry: MaxxWidgetEntry

    var body: some View {
        switch family {
        case .accessoryCircular, .accessoryRectangular:
            MaxxLockScreenView(entry: entry)
        default:
            MaxxHomeScreenView(entry: entry)
        }
    }
}

struct MaxxWidget: Widget {
    let kind: String = "MaxxWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MaxxWidgetProvider()) { entry in
            MaxxWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("MAXX Progress")
        .description("Your streak, level, and credits at a glance.")
        .supportedFamilies([.systemSmall, .accessoryCircular, .accessoryRectangular])
    }
}
