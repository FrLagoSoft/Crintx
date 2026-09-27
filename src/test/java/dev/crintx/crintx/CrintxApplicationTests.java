package dev.crintx.crintx;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@Disabled("Prueba de integración de contexto completo desactivada (requiere MongoDB corriendo)")
class CrintxApplicationTests {

    @Test
    void contextLoads() {
    }
}
