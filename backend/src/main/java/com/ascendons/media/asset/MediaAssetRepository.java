package com.ascendons.media.asset;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MediaAssetRepository extends JpaRepository<MediaAsset, UUID> {

    List<MediaAsset> findByPlacementOrderByDisplayOrderAsc(String placement);

    List<MediaAsset> findByTypeOrderByPlacementAscDisplayOrderAsc(String type);
}
