use std::path::PathBuf;

use tauri::webview::{NewWindowResponse, Url, WebviewWindowBuilder};
use tauri::WebviewUrl;

const APP_HOST: &str = "memos.goreecloud.com";
const APP_URL: &str = "https://memos.goreecloud.com";

fn is_local_app_navigation(url: &Url) -> bool {
    matches!(
        (url.scheme(), url.host_str()),
        ("tauri", Some("localhost"))
            | ("http", Some("tauri.localhost"))
            | ("https", Some("tauri.localhost"))
    )
}

fn is_allowed_navigation(url: &Url) -> bool {
    is_local_app_navigation(url)
        || (url.scheme() == "https" && url.host_str() == Some(APP_HOST))
        || url.as_str() == "about:blank"
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Start from a tiny bundled Glaze launch surface so Android/Linux can
            // draw a useful first frame immediately. launch.js replaces this page
            // with the canonical HTTPS Memos origin on the next animation frame.
            WebviewWindowBuilder::new(
                app,
                "main",
                WebviewUrl::App(PathBuf::from("index.html")),
            )
            .title("GoreeCloud Memos")
            .inner_size(1180.0, 800.0)
            .min_inner_size(360.0, 640.0)
            .on_navigation(is_allowed_navigation)
            .on_new_window(|_, _| NewWindowResponse::Deny)
            .build()?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("failed to run GoreeCloud Memos client");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn allows_only_the_local_launch_surface_and_canonical_memos_https_origin() {
        assert!(is_allowed_navigation(
            &Url::parse("https://memos.goreecloud.com/").unwrap()
        ));
        assert!(is_allowed_navigation(
            &Url::parse("https://memos.goreecloud.com/m/123").unwrap()
        ));
        assert!(is_allowed_navigation(&Url::parse("tauri://localhost/").unwrap()));
        assert!(is_allowed_navigation(
            &Url::parse("http://tauri.localhost/").unwrap()
        ));
        assert!(is_allowed_navigation(&Url::parse("about:blank").unwrap()));

        assert!(!is_allowed_navigation(
            &Url::parse("http://memos.goreecloud.com/").unwrap()
        ));
        assert!(!is_allowed_navigation(
            &Url::parse("https://example.com/").unwrap()
        ));
        assert!(!is_allowed_navigation(
            &Url::parse("https://memos.goreecloud.com.evil.example/").unwrap()
        ));
        assert!(!is_allowed_navigation(
            &Url::parse("https://tauri.localhost.evil.example/").unwrap()
        ));
    }
}
