package dev.crintx.crintx.modules.collection.logic;

import dev.crintx.crintx.modules.collection.command.CreateCollectionMethodCommand;
import dev.crintx.crintx.modules.collection.dto.CollectionMethodResponseDTO;

import java.util.List;

public interface CollectionMethodsLogic {
    CollectionMethodResponseDTO createCollectionMethod(CreateCollectionMethodCommand command);
    List<CollectionMethodResponseDTO> getCollectionMethods(String merchantId);
}
