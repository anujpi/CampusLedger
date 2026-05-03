module org.anuj.demo {
    requires javafx.controls;
    requires javafx.fxml;


    opens org.anuj.demo to javafx.fxml;
    exports org.anuj.demo;
}