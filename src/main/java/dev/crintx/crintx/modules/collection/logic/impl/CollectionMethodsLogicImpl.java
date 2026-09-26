package dev.crintx.crintx.modules.collection.logic.impl;

import dev.crintx.crintx.modules.collection.command.CreateCollectionMethodCommand;
import dev.crintx.crintx.modules.collection.dto.CollectionMethodResponseDTO;
import dev.crintx.crintx.modules.collection.logic.CollectionMethodsLogic;
import dev.crintx.crintx.modules.collection.mapper.CollectionMethodsMapper;
import dev.crintx.crintx.modules.collection.port.out.CollectionMethodRepositoryPort;
import dev.crintx.crintx.modules.collection.port.out.CollectionMethodRepositoryPort.CollectionMethodData;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CollectionMethodsLogicImpl implements CollectionMethodsLogic {

    private final CollectionMethodRepositoryPort repositoryPort;
    private final CollectionMethodsMapper mapper;

    public CollectionMethodsLogicImpl(
        CollectionMethodRepositoryPort repositoryPort,
        CollectionMethodsMapper mapper
    ) {
        this.repositoryPort = repositoryPort;
        this.mapper = mapper;
    }

    @Override
    public CollectionMethodResponseDTO createCollectionMethod(CreateCollectionMethodCommand command) {
        // 1. Mapear command a objeto de datos / entidad
        CollectionMethodData data = mapper.toData(command);

        // 2. Guardar a través del puerto de persistencia
        CollectionMethodData saved = repositoryPort.save(data);

        // 3. Retornar DTO mapeado
        return mapper.toResponseDTO(saved);
    }

    @Override
    public List<CollectionMethodResponseDTO> getCollectionMethods(String merchantId) {
        return repositoryPort.findByMerchantId(merchantId).stream()
            .map(mapper::toResponseDTO)
            .toList();
    }
}
