use tauri::webview::{NewWindowResponse, Url, WebviewWindowBuilder};
use tauri::WebviewUrl;

const APP_HOST: &str = "memos.goreecloud.com";
const APP_URL: &str = "https://memos.goreecloud.com";

fn is_allowed_navigation(url: &Url) -> bool {
    (url.scheme() == "https" && url.host_str() == Some(APP_HOST)) || url.as_str() == "about:blank"
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_url = APP_URL.parse()?;

            WebviewWindowBuilder::new(app, "main", WebviewUrl::External(app_url))
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
    fn allows_only_the_canonical_memos_https_origin() {
        assert!(is_allowed_navigation(&Url::parse("https://memos.goreecloud.com/").unwrap()));
        assert!(is_allowed_navigation(&Url::parse("https://memos.goreecloud.com/m/123").unwrap()));
        assert!(is_allowed_navigation(&Url::parse("about:blank").unwrap()));

        assert!(!is_allowed_navigation(&Url::parse("http://memos.goreecloud.com/").unwrap()));
        assert!(!is_allowed_navigation(&Url::parse("https://example.com/").unwrap()));
        assert!(!is_allowed_navigation(&Url::parse("https://memos.goreecloud.com.evil.example/").unwrap()));
    }
}
