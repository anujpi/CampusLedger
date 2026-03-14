package org.anuj.miniprojectfintech.CSV;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CredentialRepo extends JpaRepository<CredentialRecord,Long>{
     List<CredentialRecord>findByDownloadedFalse();

     Long countByDownloadedFalse();
}
