#[cfg(windows)]
use std::ffi::OsStr;
#[cfg(windows)]
use std::os::windows::ffi::OsStrExt;
#[cfg(windows)]
use windows::core::PCWSTR;
#[cfg(windows)]
use windows::Win32::Foundation::HWND;
#[cfg(windows)]
use windows::Win32::Graphics::Gdi::{
    DeleteObject, GetDIBits, GetDC, ReleaseDC, CreateCompatibleDC, DeleteDC,
    BITMAPINFO, BITMAPINFOHEADER, BI_RGB, DIB_RGB_COLORS,
};
#[cfg(windows)]
use windows::Win32::UI::Shell::{SHGetFileInfoW, SHGFI_ICON, SHGFI_LARGEICON, SHFILEINFOW};
#[cfg(windows)]
use windows::Win32::Storage::FileSystem::FILE_FLAGS_AND_ATTRIBUTES;
#[cfg(windows)]
use windows::Win32::UI::WindowsAndMessaging::{DestroyIcon, GetIconInfo, HICON};

#[cfg(windows)]
pub fn get_file_icon_base64(path: &str) -> Result<String, String> {
    unsafe {
        let mut path_w: Vec<u16> = OsStr::new(path).encode_wide().collect();
        path_w.push(0);

        let mut shfi = SHFILEINFOW::default();
        let result = SHGetFileInfoW(
            PCWSTR(path_w.as_ptr()),
            FILE_FLAGS_AND_ATTRIBUTES(0),
            Some(&mut shfi),
            std::mem::size_of::<SHFILEINFOW>() as u32,
            SHGFI_ICON | SHGFI_LARGEICON,
        );

        if result == 0 || shfi.hIcon.is_invalid() {
            return Err("Failed to get file icon".to_string());
        }

        let hicon = shfi.hIcon;
        let base64_str = hicon_to_base64(hicon);
        let _ = DestroyIcon(hicon);

        base64_str
    }
}

#[cfg(windows)]
unsafe fn hicon_to_base64(hicon: HICON) -> Result<String, String> {
    let mut icon_info = std::mem::zeroed();
    if GetIconInfo(hicon, &mut icon_info).is_err() {
        return Err("GetIconInfo failed".to_string());
    }

    let hbm_color = icon_info.hbmColor;
    let hbm_mask = icon_info.hbmMask;

    let mut bmp: windows::Win32::Graphics::Gdi::BITMAP = std::mem::zeroed();
    if windows::Win32::Graphics::Gdi::GetObjectW(
        hbm_color,
        std::mem::size_of::<windows::Win32::Graphics::Gdi::BITMAP>() as i32,
        Some(&mut bmp as *mut _ as *mut _),
    ) == 0 {
        let _ = DeleteObject(hbm_color);
        let _ = DeleteObject(hbm_mask);
        return Err("GetObjectW failed".to_string());
    }

    let width = bmp.bmWidth;
    let height = bmp.bmHeight;

    let hdc_screen = GetDC(HWND::default());
    let hdc_mem = CreateCompatibleDC(hdc_screen);

    let mut bmi = BITMAPINFO {
        bmiHeader: BITMAPINFOHEADER {
            biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
            biWidth: width,
            biHeight: -height, // top-down
            biPlanes: 1,
            biBitCount: 32,
            biCompression: BI_RGB.0,
            biSizeImage: 0,
            biXPelsPerMeter: 0,
            biYPelsPerMeter: 0,
            biClrUsed: 0,
            biClrImportant: 0,
        },
        bmiColors: [std::mem::zeroed(); 1],
    };

    let mut pixels: Vec<u8> = vec![0; (width * height * 4) as usize];

    let lines = GetDIBits(
        hdc_mem,
        hbm_color,
        0,
        height as u32,
        Some(pixels.as_mut_ptr() as *mut _),
        &mut bmi,
        DIB_RGB_COLORS,
    );

    let _ = DeleteDC(hdc_mem);
    let _ = ReleaseDC(HWND::default(), hdc_screen);
    let _ = DeleteObject(hbm_color);
    let _ = DeleteObject(hbm_mask);

    if lines == 0 {
        return Err("GetDIBits failed".to_string());
    }

    // Convert BGRA to RGBA
    for chunk in pixels.chunks_exact_mut(4) {
        let b = chunk[0];
        let r = chunk[2];
        chunk[0] = r;
        chunk[2] = b;
    }

    let img = image::RgbaImage::from_raw(width as u32, height as u32, pixels)
        .ok_or("Failed to create image")?;

    let mut cursor = std::io::Cursor::new(Vec::new());
    img.write_to(&mut cursor, image::ImageFormat::Png)
        .map_err(|e| e.to_string())?;

    use base64::{Engine as _, engine::general_purpose};
    let b64 = general_purpose::STANDARD.encode(cursor.into_inner());

    Ok(format!("data:image/png;base64,{}", b64))
}

#[cfg(not(windows))]
pub fn get_file_icon_base64(_path: &str) -> Result<String, String> {
    Err("Not implemented for this OS".to_string())
}
