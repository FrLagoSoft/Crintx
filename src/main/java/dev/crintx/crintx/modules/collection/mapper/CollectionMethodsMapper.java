package dev.crintx.crintx.modules.collection.mapper;

import dev.crintx.crintx.modules.collection.command.CreateCollectionMethodCommand;
import dev.crintx.crintx.modules.collection.dto.CollectionMethodRequestDTO;
import dev.crintx.crintx.modules.collection.dto.CollectionMethodResponseDTO;
import dev.crintx.crintx.modules.collection.enums.CollectionStatus;
import dev.crintx.crintx.modules.collection.port.out.CollectionMethodRepositoryPort.CollectionMethodData;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class CollectionMethodsMapper {

    public CreateCollectionMethodCommand toCommand(String merchantId, CollectionMethodRequestDTO dto) {
        return new CreateCollectionMethodCommand(
            merchantId,
            dto.name(),
            dto.type(),
            dto.accountNumber(),
            dto.alias()
        );
    }

    public CollectionMethodData toData(CreateCollectionMethodCommand command) {
        return new CollectionMethodData(
            UUID.randomUUID().toString(),
            command.merchantId(),
            command.name(),
            command.type(),
            command.accountNumber(),
            command.alias(),
            CollectionStatus.ACTIVE,
            LocalDateTime.now()
        );
    }

    public CollectionMethodResponseDTO toResponseDTO(CollectionMethodData data) {
        return new CollectionMethodResponseDTO(
            data.id(),
            data.merchantId(),
            data.name(),
            data.type(),
            data.accountNumber(),
            data.alias(),
            data.status(),
            data.createdAt()
        );
    }
}
