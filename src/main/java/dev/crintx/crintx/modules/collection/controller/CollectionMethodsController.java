package dev.crintx.crintx.modules.collection.controller;

import dev.crintx.crintx.common.dto.ApiResponseDTO;
import dev.crintx.crintx.modules.collection.command.CreateCollectionMethodCommand;
import dev.crintx.crintx.modules.collection.dto.CollectionMethodRequestDTO;
import dev.crintx.crintx.modules.collection.dto.CollectionMethodResponseDTO;
import dev.crintx.crintx.modules.collection.logic.CollectionMethodsLogic;
import dev.crintx.crintx.modules.collection.mapper.CollectionMethodsMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/collection-methods")
public class CollectionMethodsController {

    private final CollectionMethodsLogic logic;
    private final CollectionMethodsMapper mapper;

    public CollectionMethodsController(CollectionMethodsLogic logic, CollectionMethodsMapper mapper) {
        this.logic = logic;
        this.mapper = mapper;
    }

    @PostMapping
    public ResponseEntity<ApiResponseDTO<CollectionMethodResponseDTO>> create(
        @RequestHeader(value = "X-Merchant-Id", defaultValue = "merchant-default-001") String merchantId,
        @RequestBody CollectionMethodRequestDTO requestDTO
    ) {
        // 1. Mapeo de Request a Command inmutable
        CreateCollectionMethodCommand command = mapper.toCommand(merchantId, requestDTO);

        // 2. Ejecutar la lógica de negocio
        CollectionMethodResponseDTO result = logic.createCollectionMethod(command);

        // 3. Responder con DTO estandarizado
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponseDTO.ok(result, "Método de cobro creado exitosamente"));
    }

    @GetMapping
    public ResponseEntity<ApiResponseDTO<List<CollectionMethodResponseDTO>>> list(
        @RequestHeader(value = "X-Merchant-Id", defaultValue = "merchant-default-001") String merchantId
    ) {
        List<CollectionMethodResponseDTO> methods = logic.getCollectionMethods(merchantId);
        return ResponseEntity.ok(ApiResponseDTO.ok(methods, "Métodos de cobro listados"));
    }
}
