use axum::Router;
use std::net::SocketAddr;

mod api;
mod models;

#[tokio::main]
async fn main() {
    // build our application with the API router
    let app = api::api_router();

    // run it with hyper on localhost:3000
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("listening on {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
