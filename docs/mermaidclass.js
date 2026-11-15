classDiagram
    direction TB

    class Main {
        <<function>>
        +Future<void> main()
    }

    class MyApp {
        +Widget build(BuildContext context)
    }

    class OfflineBanner {
        +Widget build(BuildContext context)
    }

    class AppTheme {
        +static ValueNotifier<ThemeMode> mode
        +static Future<void> load()
        +static ThemeData build(Brightness brightness)
    }

    class Connection {
        +static ValueNotifier<bool> online
    }

    class Session {
        +static Future<void> load()
    }

    class Routes {
        +static Map<String, WidgetBuilder> getRoutes
    }

    Main --> Session : calls load()
    Main --> AppTheme : calls load()
    Main --> MyApp : runs app
    MyApp --> AppTheme : listens to mode
    MyApp --> Routes : gets route map
    MyApp *-- OfflineBanner : wraps every screen via builder
    OfflineBanner --> Connection : listens to online status
