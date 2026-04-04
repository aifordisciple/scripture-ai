//! Tauri backend library module
//!
//! This module contains the main application logic for the desktop backend.

pub mod commands;

pub use commands::{auth, storage};